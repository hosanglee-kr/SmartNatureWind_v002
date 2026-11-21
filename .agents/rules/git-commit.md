# Git Commit 규칙

사용자가 `git commit` 진행을 요청하면 아래 절차대로 처리한다.

1. **유형별 분리 커밋**: `git status --short`로 변경 파일을 확인한 뒤, 성격별로 그룹을 나누어 각각 커밋한다.
   - 백엔드 C++ (`feat(...)` / `fix(...)`)
   - 프론트엔드 원본 + 번들/Gzip 산출물 (`fix(fe)` / `feat(fe)`)
   - 계약 문서 (`docs(contract)`)
   - 에이전트 규칙·빌드 설정 (`docs(rules)` / `chore(pio)`)
   - 지식 그래프 산출물 (`chore(graphify)`)
2. **실행 환경**: `.git/index.lock` 생성 권한 오류 방지를 위해 `git add` / `git commit` 명령은 `BypassSandbox: true`로 실행하며, PowerShell 구분자는 `;`를 사용한다.
3. **결과 보고**: 완료 후 각 커밋의 해시, 메시지, 주요 변경 파일을 요약 보고한다.
