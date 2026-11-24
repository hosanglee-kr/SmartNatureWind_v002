import argparse
import glob
import json
import os
import urllib.request

LM_URL = "http://localhost:1234/v1/chat/completions"
MODEL = "google/gemma-4-e4b"
CHUNK_CHARS = 2500


def call_lm(prompt: str, max_tokens: int) -> str:
    messages = [
        {
            "role": "system",
            "content": "당신은 ESP32-S3 C++17 임베디드 시스템 아키텍트입니다. 서론이나 인사말 없이 핵심 표와 불릿만 사용하여 한국어로 간결하고 정확하게 Spec을 작성하세요.",
        },
        {"role": "user", "content": prompt},
    ]
    full_text = ""
    for _ in range(3):
        payload = {
            "model": MODEL,
            "messages": messages,
            "temperature": 0.2,
            "repeat_penalty": 1.1,
            "max_tokens": max_tokens,
        }
        req = urllib.request.Request(
            LM_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=600) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"HTTP {e.code}: {err_body}") from e

        choice = data["choices"][0]
        chunk_text = choice["message"]["content"]
        full_text += chunk_text
        if choice.get("finish_reason") != "length":
            break
        messages.append({"role": "assistant", "content": chunk_text})
        messages.append({"role": "user", "content": "끊긴 부분부터 이어서 끝까지 작성해줘."})
    return full_text


def summarize_file(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()

    filename = os.path.basename(file_path)
    total_len = len(content)
    # 청크당 출력 토큰 상한을 1500으로 유지해 컨텍스트 초과(HTTP 400) 방지
    dyn_max_tokens = 1500

    if total_len <= CHUNK_CHARS:
        prompt = (
            f"다음 C++ 소스 파일(`{filename}`)을 분석하여 한국어로 상세 Spec을 마크다운으로 정리해줘.\n"
            "포함 항목:\n"
            "1. 파일 역할 요약 (1~2줄)\n"
            "2. 주요 클래스/구조체/열거형\n"
            "3. 주요 함수/메서드 및 동작\n"
            "4. 외부 의존성 / 공유 상태 / 락(Mutex 등) 특이사항\n\n"
            f"```cpp\n{content}\n```"
        )
        return call_lm(prompt, dyn_max_tokens)

    # 대용량 파일은 CHUNK_CHARS 단위로 자동 분할 처리하여 잘림 방지
    chunks = [content[i : i + CHUNK_CHARS] for i in range(0, total_len, CHUNK_CHARS)]
    parts = []
    for idx, ch in enumerate(chunks, 1):
        prompt = (
            f"다음은 C++ 소스 파일(`{filename}`)의 파트 {idx}/{len(chunks)}입니다.\n"
            "이 파트에 포함된 클래스/구조체/함수/상태·락 특이사항을 한국어 마크다운으로 빠짐없이 정리해줘.\n\n"
            f"```cpp\n{ch}\n```"
        )
        parts.append(f"## 파트 {idx}/{len(chunks)}\n\n" + call_lm(prompt, dyn_max_tokens))
    return "\n\n---\n\n".join(parts)


def is_broken_or_truncated(md_path: str) -> bool:
    if not os.path.exists(md_path):
        return False
    with open(md_path, "r", encoding="utf-8", errors="replace") as f:
        txt = f.read().strip()
    if len(txt) < 300:
        return True
    if "(이하 생략)" in txt or "#### 3,,, the" in txt or "<p<p" in txt:
        return True
    return False


def main():
    parser = argparse.ArgumentParser(description="백엔드 소스 1개씩 LM Studio로 Spec 정리")
    parser.add_argument("--src-dir", default=r"d:\95.2540_PJT\SmartNatureWind_v002\src\v0203")
    parser.add_argument("--out-dir", default=r"d:\95.2540_PJT\SmartNatureWind_v002\src\v0203\doc_spec")
    parser.add_argument("--file", help="특정 파일명만 실행 (예: main.cpp)")
    parser.add_argument("--limit", type=int, default=0, help="최대 처리 파일 수 (0=전체)")
    parser.add_argument("--overwrite", action="store_true", help="이미 생성된 Spec 덮어쓰기")
    args = parser.parse_args()

    os.makedirs(args.out_dir, exist_ok=True)
    files = sorted(glob.glob(os.path.join(args.src_dir, "*.h")) + glob.glob(os.path.join(args.src_dir, "*.cpp")))
    if args.file:
        files = [f for f in files if os.path.basename(f) == args.file]

    processed = 0
    for fpath in files:
        fname = os.path.basename(fpath)
        out_path = os.path.join(args.out_dir, f"{fname}.md")
        if os.path.exists(out_path) and not args.overwrite:
            if is_broken_or_truncated(out_path):
                print(f"[RETRY] {fname} (기존 파일 손상/잘림 감지 -> 재생성)")
            else:
                print(f"[SKIP] {fname} (이미 존재)")
                continue
        print(f"[RUN] {fname} ({os.path.getsize(fpath)} bytes) -> LM Studio...")
        spec_md = summarize_file(fpath)
        with open(out_path, "w", encoding="utf-8") as out:
            out.write(f"# `{fname}` 상세 Spec\n\n{spec_md}\n")
        print(f"[DONE] {out_path}")
        processed += 1
        if args.limit and processed >= args.limit:
            break


if __name__ == "__main__":
    main()
