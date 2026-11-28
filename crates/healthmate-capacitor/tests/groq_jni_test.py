"""Run the production Groq decoder, Android JSON oracle and transport on a host JVM."""

import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

CRATE = Path(__file__).resolve().parents[1]
ROOT = CRATE.parents[1]
GRADLE = Path(os.environ.get("GRADLE_USER_HOME", Path.home() / ".gradle"))
MODULES = GRADLE / "caches/modules-2/files-2.1"


def jar(module, pattern):
    hits = sorted((MODULES / module).rglob(pattern))
    if not hits:
        raise SystemExit(f"Missing {pattern} in {MODULES / module}")
    return str(hits[-1])


def run(scratch):
    classes = scratch / "classes"
    classes.mkdir()
    empty = scratch / "empty"
    empty.mkdir()
    native = scratch / "native"
    native.mkdir()
    (native / "lib.rs").symlink_to(CRATE / "src/groq.rs")
    lock = CRATE / "Cargo.lock"
    versions = dict(re.findall(
        r'^name = "([^"]+)"\nversion = "([^"]+)"', lock.read_text(), re.MULTILINE
    ))
    (native / "Cargo.toml").write_text(
        '[package]\nname="groq-jni-proof"\nversion="0.1.0"\nedition="2024"\n'
        '[lib]\nname="healthmate_capacitor"\npath="lib.rs"\ncrate-type=["cdylib"]\n'
        f'[dependencies]\njni="={versions["jni"]}"\n'
        f'serde_json={{version="={versions["serde_json"]}",features=["float_roundtrip","preserve_order"]}}\n'
        '[workspace]\n'
    )
    shutil.copyfile(lock, native / "Cargo.lock")
    target = Path(os.environ.get("CARGO_TARGET_DIR", native / "target")).resolve()
    subprocess.run(
        ["cargo", "+1.100.1", "build", "--release", "--manifest-path", str(native / "Cargo.toml")],
        env={**os.environ, "CARGO_TARGET_DIR": str(target)},
        check=True,
    )
    sdk = Path(os.environ.get("ANDROID_HOME") or os.environ.get("ANDROID_SDK_ROOT")
               or Path.home() / "Library/Android/sdk")
    android = Path(os.environ.get("ANDROID_JAR", sdk / "platforms/android-37.0/android.jar"))
    deps = [
        jar("com.vaadin.external.google/android-json", "android-json-0.0.20131108.vaadin1.jar"),
        jar("junit/junit", "junit-4.13.2.jar"),
        jar("org.hamcrest/hamcrest-core", "hamcrest-core-1.3.jar"),
        jar("androidx.annotation/annotation-jvm", "annotation-jvm-[0-9]*[0-9].jar"),
        str(android),
    ]
    java = ROOT / "scripts/android-native"
    sources = [
        java / "mealplan-sync/GroqTransport.java",
        java / "mealplan-sync/SessionVault.java",
        java / "GroqTransportTest.java",
        java / "GroqVaultPolicyTest.java",
        CRATE / "android-tests/GroqDecoderParityTest.java",
        ROOT / "node_modules/@capacitor/android/capacitor/src/main/java/com/getcapacitor/JSObject.java",
    ]
    subprocess.run(
        ["javac", "-cp", os.pathsep.join(deps), "-d", str(classes), *sources], check=True
    )
    tests = [
        "com.healthmate.ai.sync." + name
        for name in ("GroqTransportTest", "GroqVaultPolicyTest", "GroqDecoderParityTest")
    ]
    for mode, libraries in [("Legacy", empty), ("Native", target / "release")]:
        subprocess.run(
            ["java", "-Xcheck:jni", f"-Djava.library.path={libraries}",
             f"-Dhealthmate.groq.require{mode}=true", "-cp", os.pathsep.join([str(classes), *deps]),
             "org.junit.runner.JUnitCore", *tests],
            check=True,
        )


if __name__ == "__main__":
    with tempfile.TemporaryDirectory(prefix="healthmate-groq-jni-") as directory:
        run(Path(directory))
