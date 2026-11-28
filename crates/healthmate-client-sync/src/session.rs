use crate::{Error, Result, Transport};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::sync::Mutex;
use time::{OffsetDateTime, format_description::well_known::Rfc3339};
use uuid::Uuid;

const SESSION: &str = "/api/mealplan/session";
const REFRESH: &str = "/api/mealplan/session/refresh";
static SESSION_ACCESS: Mutex<()> = Mutex::new(());
static TOKEN_REFRESH: Mutex<()> = Mutex::new(());

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct SessionKey {
    pub owner: String,
    pub generation: String,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Session {
    pub key: SessionKey,
    pub origin: String,
    pub access_token: String,
    pub access_expires_at: String,
    pub session_token: String,
    #[serde(default)]
    pub reason: String,
    #[serde(default)]
    pub username: String,
    #[serde(default)]
    pub full_name: String,
}

pub trait CredentialStore: Send {
    fn load(&mut self) -> std::result::Result<Option<Session>, String>;
    fn store(&mut self, session: Option<&Session>) -> std::result::Result<(), String>;
}

pub struct Sessions<V> {
    store: Mutex<V>,
}

impl<V: CredentialStore> Sessions<V> {
    pub fn new(store: V) -> Self {
        Self {
            store: Mutex::new(store),
        }
    }
    fn access_store<T>(&self, work: impl FnOnce(&mut V) -> Result<T>) -> Result<T> {
        // A newly started Android Worker can reopen the same vault through another Sessions handle.
        let _access = SESSION_ACCESS.lock().map_err(|_| Error::CredentialStore)?;
        let mut store = self.store.lock().map_err(|_| Error::CredentialStore)?;
        work(&mut store)
    }
    pub fn current(&self) -> Result<Option<Session>> {
        self.access_store(|vault| vault.load().map_err(|_| Error::CredentialStore))
    }
    pub fn replace(&self, mut session: Session) -> Result<SessionKey> {
        if session.access_token.is_empty()
            || healthmate_store::account_path(
                std::path::Path::new("."),
                &session.key.owner,
                crate::DatabaseFlavor::Production,
            )
            .is_err()
        {
            return Err(Error::InvalidData);
        }
        session.key.generation = Uuid::new_v4().to_string();
        self.access_store(|vault| {
            vault
                .store(Some(&session))
                .map_err(|_| Error::CredentialStore)
        })?;
        Ok(session.key)
    }
    pub fn clear(&self, expected: &SessionKey) -> Result<()> {
        self.access_store(|vault| {
            Self::matching(vault, expected)?;
            vault.store(None).map_err(|_| Error::CredentialStore)
        })
    }
    fn matching(vault: &mut V, key: &SessionKey) -> Result<Session> {
        vault
            .load()
            .map_err(|_| Error::CredentialStore)?
            .filter(|s| s.key == *key)
            .ok_or(Error::SessionChanged)
    }
    pub fn with_current<T>(
        &self,
        key: &SessionKey,
        f: impl FnOnce(&Session) -> Result<T>,
    ) -> Result<T> {
        self.access_store(|vault| f(&Self::matching(vault, key)?))
    }
    pub fn update(&self, key: &SessionKey, f: impl FnOnce(&mut Session)) -> Result<Session> {
        self.access_store(|vault| {
            let mut session = Self::matching(vault, key)?;
            f(&mut session);
            if session.key != *key {
                return Err(Error::SessionChanged);
            }
            vault
                .store(Some(&session))
                .map_err(|_| Error::CredentialStore)?;
            Ok(session)
        })
    }
    fn reject(&self, key: &SessionKey, reason: &str) -> Error {
        match self.update(key, |s| {
            s.reason = reason.into();
            s.access_token.clear();
        }) {
            Ok(_) => Error::Reauthenticate(reason.to_owned()),
            Err(e) => e,
        }
    }
    fn access<T: Transport>(
        &self,
        key: &SessionKey,
        rejected: Option<&str>,
        transport: &T,
    ) -> Result<Session> {
        let _refresh = TOKEN_REFRESH.lock().map_err(|_| Error::CredentialStore)?;
        let current = self.with_current(key, |s| Ok(s.clone()))?;
        if !current.reason.is_empty() {
            return Err(Error::Reauthenticate(current.reason));
        }
        let live = OffsetDateTime::parse(&current.access_expires_at, &Rfc3339)
            .is_ok_and(|t| t > OffsetDateTime::now_utc() + time::Duration::seconds(30));
        if !current.session_token.is_empty()
            && !current.access_token.is_empty()
            && Some(current.access_token.as_str()) != rejected
            && live
        {
            return Ok(current);
        }
        let response = if current.session_token.is_empty() {
            if current.access_token.is_empty() {
                return Err(self.reject(key, "session_expired"));
            }
            transport.request(&current.origin, SESSION, &current.access_token, Some("{}"))
        } else {
            transport.request(
                &current.origin,
                REFRESH,
                "",
                Some(&json!({"sessionToken":current.session_token}).to_string()),
            )
        };
        let fresh = match response {
            Err(Error::Http { status: 403, .. }) => {
                return Err(self.reject(key, "account_forbidden"));
            }
            Err(Error::Http {
                status: 401, code, ..
            }) => return Err(self.reject(key, terminal(&code))),
            result => result?,
        };
        if fresh["ownerId"].as_str().ok_or(Error::InvalidData)? != key.owner {
            return Err(self.reject(key, "account_forbidden"));
        }
        let access = fresh["accessToken"].as_str().ok_or(Error::InvalidData)?;
        let expiry = fresh["accessExpiresAt"]
            .as_str()
            .ok_or(Error::InvalidData)?;
        let device_token = if current.session_token.is_empty() {
            Some(fresh["sessionToken"].as_str().ok_or(Error::InvalidData)?)
        } else {
            None
        };
        self.update(key, |s| {
            s.access_token = access.into();
            s.access_expires_at = expiry.into();
            if let Some(t) = device_token {
                s.session_token = t.into();
            }
            if let Some(n) = fresh["username"].as_str() {
                s.username = n.into();
            }
            if let Some(n) = fresh["name"].as_str() {
                s.full_name = n.into();
            }
        })
    }
    pub fn request<T: Transport>(
        &self,
        key: &SessionKey,
        transport: &T,
        path: &str,
        body: Option<&str>,
    ) -> Result<Value> {
        let current = self.access(key, None, transport)?;
        for attempt in 0..2 {
            let credentials = if attempt == 0 {
                current.clone()
            } else {
                self.access(key, Some(&current.access_token), transport)?
            };
            self.with_current(key, |_| Ok(()))?;
            let response =
                transport.request(&credentials.origin, path, &credentials.access_token, body);
            self.with_current(key, |_| Ok(()))?;
            match response {
                Err(Error::Http { status: 403, .. }) => {
                    return Err(self.reject(key, "account_forbidden"));
                }
                Err(Error::Http {
                    status: 401, code, ..
                }) => {
                    if attempt == 1
                        || matches!(code.as_str(), "session_revoked" | "session_expired")
                    {
                        return Err(self.reject(key, terminal(&code)));
                    }
                }
                result => return result,
            }
        }
        unreachable!()
    }
}

fn terminal(code: &str) -> &'static str {
    if code == "session_revoked" {
        "session_revoked"
    } else {
        "session_expired"
    }
}
