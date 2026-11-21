# Git Commit 규칙

사용자가 `git commit` 진행을 요청하면 아래 일반화된 절차대로 처리한다.

1. **사전 전수 확인**: 반드시 `git status --short`를 먼저 실행해 모든 변경(Modified/Untracked) 파일을 누락 없이 파악한다.
2. **성격별 분리 커밋**: 변경 파일을 성격(기능/수정/문서/설정/빌드·그래프 산출물 등)별로 그룹화하여 각각 `git add` + `git commit` 한다.
   - 커밋 메시지 형식: `<type>(<scope>): <한국어 요약>` (예: `feat`, `fix`, `docs`, `chore`, `refactor`)
   - 특정 파일만 기억에 의존해 커밋하지 말고, `git status --short` 목록 전체를 빠짐없이 배분한다.
3. **실행 환경**: `.git/index.lock` 생성 권한 오류 방지를 위해 `git add` / `git commit`은 `BypassSandbox: true`로 실행하며, PowerShell 구분자는 `;`를 사용한다.
4. **사후 검증 및 보고**: 커밋 완료 후 `git status --short`로 남은 미커밋 파일이 없는지 확인하고, 각 커밋 해시·메시지·대상 파일을 요약 보고한다.
