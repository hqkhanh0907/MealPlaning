use crate::{Error, Result};
use serde_json::{Value, json};
use std::time::Duration;
use ureq::Agent;
use url::Url;

pub trait Transport: Send + Sync {
    fn request(&self, origin: &str, path: &str, token: &str, body: Option<&str>) -> Result<Value>;
}

pub struct HttpTransport {
    origin: String,
    agent: Agent,
}

impl HttpTransport {
    pub fn new(origin: &str) -> Result<Self> {
        let url = Url::parse(origin).map_err(|_| Error::InvalidData)?;
        if url.scheme() != "https"
            || !url.has_host()
            || !url.username().is_empty()
            || url.password().is_some()
            || url.query().is_some()
            || url.fragment().is_some()
            || url.path() != "/"
        {
            return Err(Error::InvalidData);
        }
        let timeout = Some(Duration::from_secs(12));
        let config = Agent::config_builder()
            .https_only(true)
            .http_status_as_error(false)
            .max_redirects(0)
            .timeout_connect(timeout)
            .timeout_recv_response(timeout)
            .timeout_recv_body(timeout)
            .timeout_send_body(timeout)
            .build();
        Ok(Self {
            origin: origin.trim_end_matches('/').to_owned(),
            agent: Agent::new_with_config(config),
        })
    }
}

impl Transport for HttpTransport {
    fn request(&self, origin: &str, path: &str, token: &str, body: Option<&str>) -> Result<Value> {
        if origin.trim_end_matches('/') != self.origin
            || !path.starts_with('/')
            || path.starts_with("//")
        {
            return Err(Error::InvalidData);
        }
        let uri = format!("{}{path}", self.origin);
        let resp = if let Some(body) = body {
            let req = self
                .agent
                .post(uri)
                .header("Accept", "application/json")
                .header("Content-Type", "application/json");
            let req = if token.is_empty() {
                req
            } else {
                req.header("Authorization", token)
            };
            req.send(body)
        } else {
            let req = self.agent.get(uri).header("Accept", "application/json");
            let req = if token.is_empty() {
                req
            } else {
                req.header("Authorization", token)
            };
            req.call()
        };
        let mut response = resp.map_err(|_| Error::Network)?;
        let status = response.status().as_u16();
        let bytes = response
            .body_mut()
            .with_config()
            .limit(64 * 1024 * 1024)
            .read_to_vec()
            .map_err(|_| Error::Network)?;
        let text = std::str::from_utf8(&bytes).map_err(|_| Error::Network)?;
        if text.encode_utf16().count() > 16 * 1024 * 1024 {
            return Err(Error::Network);
        }
        let value = if text.is_empty() {
            Some(json!({}))
        } else {
            serde_json::from_str::<Value>(text).ok()
        };
        if (200..300).contains(&status) {
            return value.filter(Value::is_object).ok_or(Error::Network);
        }
        let fields = value.as_ref().and_then(|v| v.get("data"));
        let code = fields
            .and_then(|v| v["code"].as_str())
            .unwrap_or_default()
            .to_owned();
        let conflict = if status == 409 && code == "workout_conflict" {
            fields
                .and_then(|v| v.get("conflict"))
                .filter(|v| v.is_object())
                .cloned()
        } else {
            None
        };
        Err(Error::Http {
            status,
            code,
            conflict,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{BufRead, BufReader, Read, Write};
    use std::{net::TcpListener, thread};

    #[test]
    fn preserves_signed_request_bytes_and_structured_conflicts_over_http() {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let origin = format!("http://{}", listener.local_addr().unwrap());
        let raw = r#"{"baseRevision":1,"snapshot":{"value":0.000001},"operationId":"frozen"}"#;
        let server = thread::spawn(move || {
            let (mut sock, _) = listener.accept().unwrap();
            let mut stream = BufReader::new(&sock);
            let mut first = String::new();
            stream.read_line(&mut first).unwrap();
            assert_eq!(first, "POST /api/mealplan/workspace HTTP/1.1\r\n");
            let mut headers = std::collections::HashMap::new();
            for line in stream.by_ref().lines() {
                let line = line.unwrap();
                if line.is_empty() {
                    break;
                }
                let (k, v) = line.split_once(':').unwrap();
                headers.insert(k.to_ascii_lowercase(), v.trim().to_owned());
            }
            assert_eq!(headers["authorization"], "device-access");
            assert_eq!(headers["content-type"], "application/json");
            let mut bytes = vec![0; headers["content-length"].parse().unwrap()];
            stream.read_exact(&mut bytes).unwrap();
            assert_eq!(bytes, raw.as_bytes());
            let body =
                r#"{"data":{"code":"workout_conflict","conflict":{"revision":2,"items":[]}}}"#;
            write!(
                sock,
                "HTTP/1.1 409 Conflict\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
                body.len()
            )
            .unwrap();
        });
        let config = Agent::config_builder()
            .max_redirects(0)
            .http_status_as_error(false)
            .build();
        let client = HttpTransport {
            origin: origin.clone(),
            agent: Agent::new_with_config(config),
        };
        let error = client
            .request(
                &origin,
                "/api/mealplan/workspace",
                "device-access",
                Some(raw),
            )
            .unwrap_err();
        assert!(
            matches!(error,Error::Http{status:409,ref code,conflict:Some(ref c)} if code=="workout_conflict" && c["revision"]==2)
        );
        server.join().unwrap();
    }

    #[test]
    fn production_request_binds_tokens_to_one_https_origin() {
        let client = HttpTransport::new("https://healthmate.example").unwrap();
        assert!(HttpTransport::new("https://name@healthmate.example").is_err());
        assert!(matches!(
            client.request("https://different.example", "/workspace", "token", None),
            Err(Error::InvalidData)
        ));
        assert!(matches!(
            client.request(
                "https://healthmate.example",
                "//different.example",
                "token",
                None
            ),
            Err(Error::InvalidData)
        ));
    }
}
