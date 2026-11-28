use healthmate_server::{Server, copy_database};
use std::{
    env,
    io::{self, Read},
    net::Ipv4Addr,
    path::{Path, PathBuf},
};
use tokio::net::TcpListener;

fn port(key: &str, default: u16) -> io::Result<u16> {
    env::var(key).map_or(Ok(default), |p| p.parse().map_err(io::Error::other))
}

#[tokio::main]
async fn main() -> io::Result<()> {
    let args: Vec<_> = env::args().skip(1).collect();
    let file = PathBuf::from(
        env::var_os("MEALPLAN_DB_PATH").unwrap_or_else(|| "healthmate.sqlite3".into()),
    );
    match args.as_slice() {
        [] | [_] if args.is_empty() || args[0] == "serve" => {
            let state = Server::open(file, env::var("MEALPLAN_RELEASE").unwrap_or_default())?;
            let private =
                TcpListener::bind((Ipv4Addr::LOCALHOST, port("MEALPLAN_DB_PORT", 18089)?)).await?;
            let public =
                TcpListener::bind((Ipv4Addr::LOCALHOST, port("MEALPLAN_API_PORT", 18090)?)).await?;
            eprintln!(
                "HealthMate private {} public {}",
                private.local_addr()?,
                public.local_addr()?
            );
            tokio::try_join!(
                axum::serve(private, state.private_router()),
                axum::serve(public, state.public_router())
            )?;
            Ok(())
        }
        [cmd, email] if cmd == "operator" => {
            let mut password = String::new();
            io::stdin().take(2048).read_to_string(&mut password)?;
            Server::open(file, "")?
                .provision_operator(email, password.trim_end_matches(['\r', '\n']))
        }
        [cmd, dest] if cmd == "backup" => copy_database(&file, Path::new(dest)),
        [cmd, source, dest] if cmd == "restore" => {
            copy_database(Path::new(source), Path::new(dest))
        }
        _ => Err(io::Error::other(
            "Use serve, operator <email> (password on stdin), backup <new-file>, or restore <backup> <new-file>.",
        )),
    }
}
