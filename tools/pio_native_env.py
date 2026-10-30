Import("env")
import os
import shutil

mingw_bin = os.path.expanduser(r"~/.platformio/packages/toolchain-gccmingw32/bin")

if os.path.exists(mingw_bin):
    env.PrependENVPath("PATH", mingw_bin)
    os.environ["PATH"] = mingw_bin + os.pathsep + os.environ.get("PATH", "")

    # Ensure runtime DLLs exist in the test output directory
    build_dir = env.subst("$BUILD_DIR")
    if not os.path.exists(build_dir):
        os.makedirs(build_dir, exist_ok=True)
    for dll in ["libgcc_s_dw2-1.dll", "libwinpthread-1.dll", "libstdc++-6.dll"]:
        src = os.path.join(mingw_bin, dll)
        dst = os.path.join(build_dir, dll)
        if os.path.exists(src) and not os.path.exists(dst):
            shutil.copy2(src, dst)
