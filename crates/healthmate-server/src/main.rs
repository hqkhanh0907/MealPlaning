use healthmate_server::{Server, copy_database, import_pocketbase};
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
        [] | [_]
            if args.is_empty()
                || matches!(args[0].as_str(), "serve" | "serve-private" | "serve-public") =>
        {
            let state = Server::open(file, env::var("MEALPLAN_RELEASE").unwrap_or_default())?;
            let private = || async {
                TcpListener::bind((Ipv4Addr::LOCALHOST, port("MEALPLAN_DB_PORT", 18089)?)).await
            };
            let public = || async {
                TcpListener::bind((Ipv4Addr::LOCALHOST, port("MEALPLAN_API_PORT", 18090)?)).await
            };
            match args.first().map(String::as_str) {
                Some("serve-private") => {
                    axum::serve(private().await?, state.private_router()).await
                }
                Some("serve-public") => axum::serve(public().await?, state.public_router()).await,
                _ => {
                    let internal = private().await?;
                    let gateway = public().await?;
                    eprintln!(
                        "HealthMate private {} public {}",
                        internal.local_addr()?,
                        gateway.local_addr()?
                    );
                    tokio::try_join!(
                        axum::serve(internal, state.private_router()),
                        axum::serve(gateway, state.public_router())
                    )?;
                    Ok(())
                }
            }
        }
        [cmd, email] if cmd == "operator" => {
            let mut password = String::new();
            io::stdin().take(2048).read_to_string(&mut password)?;
            Server::open(file, "")?
                .provision_operator(email, password.trim_end_matches(['\r', '\n']))
        }
        [cmd, source, dest] if cmd == "import-pocketbase" => {
            for (table, rows) in import_pocketbase(Path::new(source), Path::new(dest))? {
                println!("{table}: {rows}");
            }
            Ok(())
        }
        [cmd, dest] if cmd == "backup" => copy_database(&file, Path::new(dest)),
        [cmd, source, dest] if cmd == "restore" => {
            copy_database(Path::new(source), Path::new(dest))
        }
        _ => Err(io::Error::other(
            "Use serve, operator <email> (password on stdin), backup <new-file>, restore <backup> <new-file>, or import-pocketbase <data.db> <new-file>.",
        )),
    }
}
