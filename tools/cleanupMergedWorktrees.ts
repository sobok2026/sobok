#!/usr/bin/env bun

/**
 * main에 머지된 워크트리와 로컬 브랜치를 정리한다.
 *
 *   bun run worktree:clean          # 미리보기. 아무것도 지우지 않는다
 *   bun run worktree:clean --yes    # 실제 삭제
 *
 * 머지 판정은 세 신호를 OR로 묶는다. 하나라도 참이면 그 브랜치에는 main에 없는 것이 없다.
 *   1. 조상   브랜치 끝이 기준 브랜치의 조상이다 — merge commit·fast-forward 머지가 여기 걸린다.
 *   2. PR     GitHub에 같은 head 이름으로 머지된 PR이 있다 — squash·rebase 머지가 여기 걸린다.
 *   3. 패치   브랜치를 분기점 위에 squash한 커밋의 patch-id가 이미 기준 브랜치에 있다 — gh 없이도 squash를 잡는다.
 *
 * 판정이 서면 워크트리 쪽 안전장치를 한 번 더 통과해야 실제 삭제 대상이 된다.
 * 지금 실행 중인 워크트리, 잠긴 워크트리, 커밋 안 한 변경이 있는 워크트리, .env가 남은 워크트리는 건너뛴다.
 */

import { parseArgs } from 'node:util'

// ── 상수 ──────────────────────────────────────────────────────────────────────

/** --base를 안 주면 이 순서로 먼저 존재하는 ref를 기준으로 삼는다. 원격이 로컬보다 최신인 경우가 많아 origin이 앞이다. */
const BASE_CANDIDATES = ['origin/main', 'main']

/** 어떤 판정이 나와도 지우지 않는 브랜치. 기준 브랜치와 메인 워크트리의 브랜치가 여기 자동으로 더해진다. */
const ALWAYS_PROTECTED = ['main', 'master']

/** gh로 한 번에 훑는 머지된 PR 개수. 이보다 오래된 PR은 조상·패치 신호로만 판정한다. */
const DEFAULT_PR_LIMIT = 200

/**
 * squash 판정용 임시 커밋의 신원과 시각을 고정한다.
 * 같은 브랜치를 몇 번을 검사해도 같은 오브젝트가 나와서 저장소가 불어나지 않고, git config에도 의존하지 않는다.
 */
const PROBE_ENV = {
  GIT_AUTHOR_NAME: 'worktree-cleanup',
  GIT_AUTHOR_EMAIL: 'worktree-cleanup@localhost',
  GIT_AUTHOR_DATE: '1970-01-01T00:00:00Z',
  GIT_COMMITTER_NAME: 'worktree-cleanup',
  GIT_COMMITTER_EMAIL: 'worktree-cleanup@localhost',
  GIT_COMMITTER_DATE: '1970-01-01T00:00:00Z',
}

const USAGE = `main에 머지된 워크트리와 로컬 브랜치를 정리한다.

사용법
  bun run worktree:clean [옵션]

옵션
  -y, --yes           실제로 지운다. 없으면 미리보기만 하고 끝난다.
      --base <ref>    기준 브랜치. 기본값은 ${BASE_CANDIDATES.join(' → ')} 중 먼저 존재하는 것.
      --include-empty main에 없는 커밋이 하나도 없는 브랜치도 대상에 넣는다.
                      머지 기록 없이 시작만 하고 커밋을 안 한 워크트리가 여기 해당한다.
      --force         .env 같은 무시된 파일이 남아있어도 워크트리를 지운다.
      --no-fetch      git fetch --prune을 건너뛴다. 기준 브랜치가 낡을 수 있다.
      --no-gh         GitHub PR 조회를 건너뛴다. squash 머지는 패치 신호로만 잡는다.
      --pr-limit <n>  훑을 머지된 PR 개수. 기본값 ${DEFAULT_PR_LIMIT}.
  -h, --help          이 도움말.

지우지 않는 것
  기준 브랜치와 main·master, 메인 워크트리의 브랜치, 지금 실행 중인 워크트리,
  잠긴 워크트리, 커밋 안 한 변경이 남은 워크트리, 원격 브랜치.

워크트리를 지우면 그 안의 무시된 파일(node_modules, .turbo, .env.local)도 같이 사라진다.`

// ── 프로세스 실행 ─────────────────────────────────────────────────────────────

type CommandResult = { code: number; stdout: string; stderr: string }

async function run(
  command: readonly string[],
  options: { cwd?: string; env?: Record<string, string> } = {},
): Promise<CommandResult> {
  const child = Bun.spawn(command as string[], {
    cwd: options.cwd,
    env: options.env ? { ...process.env, ...options.env } : process.env,
    stdin: 'ignore',
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const [stdout, stderr] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text()])

  return { code: await child.exited, stdout: stdout.trim(), stderr: stderr.trim() }
}

function git(args: readonly string[], options: { cwd?: string; env?: Record<string, string> } = {}) {
  return run(['git', ...args], options)
}

/** 실패하면 던진다. 실패가 곧 버그이거나 더 진행할 수 없는 호출에만 쓴다. */
async function gitOrThrow(args: readonly string[], options: { cwd?: string } = {}): Promise<string> {
  const result = await git(args, options)
  if (result.code !== 0) {
    throw new Error(`git ${args.join(' ')} 실패 (${result.code})\n${result.stderr}`)
  }

  return result.stdout
}

// ── 워크트리 ──────────────────────────────────────────────────────────────────

type Worktree = {
  path: string
  head: string | null
  branch: string | null
  isMain: boolean
  isCurrent: boolean
  locked: boolean
  prunable: boolean
}

/**
 * `git worktree list --porcelain`은 레코드를 빈 줄로 구분하고, 첫 레코드가 항상 메인 워크트리다.
 * 각 줄은 `key value` 형태이고 bare·detached·locked·prunable은 값이 없을 수도 있다.
 */
function parseWorktrees(porcelain: string, currentPath: string | null): Worktree[] {
  return porcelain
    .split('\n\n')
    .filter((block) => block.trim() !== '')
    .map((block, index) => {
      const worktree: Worktree = {
        path: '',
        head: null,
        branch: null,
        isMain: index === 0,
        isCurrent: false,
        locked: false,
        prunable: false,
      }

      for (const line of block.split('\n')) {
        const separator = line.indexOf(' ')
        const key = separator === -1 ? line : line.slice(0, separator)
        const value = separator === -1 ? '' : line.slice(separator + 1)

        if (key === 'worktree') worktree.path = value
        else if (key === 'HEAD') worktree.head = value
        else if (key === 'branch') worktree.branch = value.replace(/^refs\/heads\//, '')
        else if (key === 'locked') worktree.locked = true
        else if (key === 'prunable') worktree.prunable = true
      }

      worktree.isCurrent = currentPath !== null && worktree.path === currentPath

      return worktree
    })
}

/** 커밋 안 한 변경이나 추적되지 않는 파일이 있으면 true. 무시된 파일은 세지 않는다. */
async function isDirty(worktreePath: string): Promise<boolean> {
  const result = await git(['status', '--porcelain', '--untracked-files=all'], { cwd: worktreePath })

  // 상태를 못 읽으면 더러운 것으로 본다. 판단이 안 서는 워크트리를 지우는 것보다 남기는 쪽이 싸다.
  return result.code !== 0 || result.stdout !== ''
}

/**
 * 워크트리를 지우면 무시된 파일도 같이 사라진다. node_modules는 다시 만들면 그만이지만 .env는 아니다.
 * --directory로 통째로 무시된 디렉터리를 접어서 node_modules 안까지 훑지 않는다.
 */
async function findLeftoverEnvFiles(worktreePath: string): Promise<string[]> {
  const result = await git(['ls-files', '--others', '--ignored', '--exclude-standard', '--directory'], {
    cwd: worktreePath,
  })
  if (result.code !== 0 || result.stdout === '') return []

  return result.stdout.split('\n').filter((path) => /(^|\/)\.env(\.|$)/.test(path))
}

// ── 머지 판정 ─────────────────────────────────────────────────────────────────

type MergedPr = { number: number }

/**
 * 머지된 PR을 한 번에 받아 head 브랜치 이름으로 색인한다.
 * 같은 이름의 fork 브랜치를 오인하지 않도록 head 저장소 소유자가 다른 PR은 버린다.
 */
async function fetchMergedPrs(owner: string, limit: number): Promise<Map<string, MergedPr>> {
  const result = await run([
    'gh',
    'pr',
    'list',
    '--state',
    'merged',
    '--limit',
    String(limit),
    '--json',
    'number,headRefName,headRepositoryOwner',
  ])
  if (result.code !== 0) throw new Error(result.stderr || 'gh pr list 실패')

  const prs = JSON.parse(result.stdout) as {
    number: number
    headRefName: string
    headRepositoryOwner: { login: string } | null
  }[]

  const byBranch = new Map<string, MergedPr>()
  for (const pr of prs) {
    if (pr.headRepositoryOwner?.login !== owner) continue
    // 같은 브랜치로 여러 번 PR을 냈다면 목록이 최신순이므로 먼저 본 것이 마지막 머지다.
    if (!byBranch.has(pr.headRefName)) byBranch.set(pr.headRefName, { number: pr.number })
  }

  return byBranch
}

/**
 * 브랜치 전체를 분기점 위에 squash한 커밋을 만들어, 그 patch-id가 이미 기준 브랜치에 있는지 본다.
 * squash 머지는 커밋을 하나로 뭉개기 때문에 커밋 단위 patch-id 비교로는 잡히지 않는다.
 * 임시 커밋은 어디에도 참조되지 않아 다음 gc 때 사라진다.
 */
async function isSquashMerged(base: string, branch: string): Promise<boolean> {
  const forkPoint = await git(['merge-base', base, branch])
  if (forkPoint.code !== 0) return false

  const tree = await git(['rev-parse', `${branch}^{tree}`])
  if (tree.code !== 0) return false

  const probe = await git(['commit-tree', tree.stdout, '-p', forkPoint.stdout, '-m', 'squash probe'], {
    env: PROBE_ENV,
  })
  if (probe.code !== 0) return false

  const cherry = await git(['cherry', base, probe.stdout])
  if (cherry.code !== 0) return false

  // `-`로 시작하면 같은 내용의 패치가 이미 기준 브랜치에 있다는 뜻이다.
  return cherry.stdout.startsWith('-')
}

// ── 판단 ──────────────────────────────────────────────────────────────────────

type Verdict = { action: 'delete' | 'keep'; reason: string }

type Candidate = {
  /** HEAD가 분리된 워크트리에는 브랜치가 없다. 그런 항목은 보고에만 오르고 삭제 대상이 되지 않는다. */
  branch: string | null
  label: string
  worktree: Worktree | null
  verdict: Verdict
}

type ClassifyContext = {
  base: string
  protectedBranches: Set<string>
  mergedPrs: Map<string, MergedPr>
  includeEmpty: boolean
}

/** 브랜치 자체만 보고 머지 여부를 정한다. 워크트리 사정은 뒤에서 따로 본다. */
async function classifyBranch(branch: string, context: ClassifyContext): Promise<Verdict> {
  if (context.protectedBranches.has(branch)) {
    return { action: 'keep', reason: '보호 브랜치' }
  }

  const ahead = Number(await gitOrThrow(['rev-list', '--count', `${context.base}..${branch}`]))
  const mergedPr = context.mergedPrs.get(branch)

  if (ahead === 0) {
    // 기준 브랜치의 조상이다. 머지 흔적이 있으면 머지된 것이고, 없으면 애초에 커밋이 없던 브랜치다.
    if (mergedPr) return { action: 'delete', reason: `PR #${mergedPr.number} 머지됨` }

    return {
      action: context.includeEmpty ? 'delete' : 'keep',
      reason: context.includeEmpty ? '기준 브랜치에 없는 커밋 없음' : '기준 브랜치에 없는 커밋 없음 (--include-empty)',
    }
  }

  if (mergedPr) return { action: 'delete', reason: `PR #${mergedPr.number} 머지됨 · 커밋 ${ahead}개` }

  if (await isSquashMerged(context.base, branch)) {
    return { action: 'delete', reason: 'squash 머지됨 · 패치 동일' }
  }

  return { action: 'keep', reason: `기준 브랜치에 없는 커밋 ${ahead}개` }
}

/** 지워도 된다는 판정이 난 브랜치에 워크트리 쪽 안전장치를 씌운다. */
async function guardWorktree(candidate: Candidate, force: boolean): Promise<Verdict> {
  const { worktree, verdict } = candidate
  if (verdict.action !== 'delete' || !worktree) return verdict

  if (worktree.isMain) return { action: 'keep', reason: '메인 워크트리' }
  if (worktree.isCurrent) return { action: 'keep', reason: '지금 실행 중인 워크트리 · 메인 저장소에서 다시 실행' }
  if (worktree.locked) return { action: 'keep', reason: '잠긴 워크트리' }

  // 디렉터리가 이미 사라진 등록만 남은 워크트리다. 검사할 작업 트리가 없으니 등록만 걷고 브랜치를 지운다.
  if (worktree.prunable) return verdict

  if (await isDirty(worktree.path)) return { action: 'keep', reason: '커밋 안 한 변경 있음' }

  if (!force) {
    const envFiles = await findLeftoverEnvFiles(worktree.path)
    if (envFiles.length > 0) {
      return { action: 'keep', reason: `${envFiles.join(', ')} 남아있음 (--force)` }
    }
  }

  return verdict
}

// ── 출력 ──────────────────────────────────────────────────────────────────────

const useColor = process.stdout.isTTY && !process.env.NO_COLOR
const paint = (code: string, text: string) => (useColor ? `\x1b[${code}m${text}\x1b[0m` : text)
const bold = (text: string) => paint('1', text)
const dim = (text: string) => paint('2', text)
const red = (text: string) => paint('31', text)
const green = (text: string) => paint('32', text)
const yellow = (text: string) => paint('33', text)

const HOME = process.env.HOME ?? ''

function formatPath(path: string, mainWorktreePath: string): string {
  if (path.startsWith(`${mainWorktreePath}/`)) return path.slice(mainWorktreePath.length + 1)
  if (HOME && path.startsWith(`${HOME}/`)) return `~/${path.slice(HOME.length + 1)}`

  return path
}

/** 한글·한자·가나는 터미널에서 두 칸을 먹는다. 열을 맞추려면 문자 수가 아니라 이 폭으로 채워야 한다. */
const WIDE_CHARACTER = /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹯＀-｠￠-￦]/

function displayWidth(text: string): number {
  let width = 0
  for (const character of text) width += WIDE_CHARACTER.test(character) ? 2 : 1

  return width
}

function printGroup(title: string, candidates: Candidate[], mainWorktreePath: string): void {
  if (candidates.length === 0) return

  console.log(`\n${title} ${dim(`(${candidates.length})`)}`)

  const width = Math.max(...candidates.map((candidate) => displayWidth(candidate.label)))
  for (const { label, worktree, verdict } of candidates) {
    const padding = ' '.repeat(width - displayWidth(label))
    const location = worktree ? ` ${dim(`· ${formatPath(worktree.path, mainWorktreePath)}`)}` : ''
    console.log(`  ${label}${padding}  ${dim(verdict.reason)}${location}`)
  }
}

// ── 삭제 ──────────────────────────────────────────────────────────────────────

/** 워크트리를 먼저 떼어내야 브랜치를 지울 수 있다. 둘 중 하나라도 실패하면 false. */
async function deleteCandidate(candidate: Candidate): Promise<boolean> {
  if (candidate.worktree && !candidate.worktree.prunable) {
    // --force를 붙이지 않는다. 여기까지 왔다면 이미 깨끗한 워크트리이고, 아니라면 git이 막는 게 맞다.
    const removal = await git(['worktree', 'remove', candidate.worktree.path])
    if (removal.code !== 0) {
      console.log(`  ${red('실패')} ${candidate.label} ${dim(`· 워크트리: ${removal.stderr}`)}`)

      return false
    }
  }

  if (candidate.branch) {
    // 이미 우리가 머지를 확인했으므로 -D를 쓴다. -d는 squash 머지된 브랜치를 거부한다.
    const deletion = await git(['branch', '-D', candidate.branch])
    if (deletion.code !== 0) {
      console.log(`  ${red('실패')} ${candidate.label} ${dim(`· 브랜치: ${deletion.stderr}`)}`)

      return false
    }
  }

  console.log(`  ${green('삭제')} ${candidate.label}`)

  return true
}

// ── 진입점 ────────────────────────────────────────────────────────────────────

async function main(): Promise<number> {
  const { values } = parseArgs({
    options: {
      yes: { type: 'boolean', short: 'y', default: false },
      base: { type: 'string' },
      'include-empty': { type: 'boolean', default: false },
      force: { type: 'boolean', default: false },
      'no-fetch': { type: 'boolean', default: false },
      'no-gh': { type: 'boolean', default: false },
      'pr-limit': { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false },
    },
    strict: true,
    allowPositionals: false,
  })

  if (values.help) {
    console.log(USAGE)

    return 0
  }

  const prLimit = values['pr-limit'] ? Number(values['pr-limit']) : DEFAULT_PR_LIMIT
  if (!Number.isInteger(prLimit) || prLimit < 1) {
    console.error(`--pr-limit은 1 이상의 정수여야 해요: ${values['pr-limit']}`)

    return 1
  }

  const gitDir = await git(['rev-parse', '--git-common-dir'])
  if (gitDir.code !== 0) {
    console.error('git 저장소 안에서 실행해주세요.')

    return 1
  }

  // 워크트리 목록의 경로는 심볼릭 링크가 풀린 절대 경로다. 현재 워크트리 경로도 같은 방식으로 얻어야 비교가 맞다.
  const currentTop = await git(['rev-parse', '--show-toplevel'])
  const currentPath = currentTop.code === 0 ? currentTop.stdout : null

  if (!values['no-fetch']) {
    const fetched = await git(['fetch', '--prune', '--quiet'])
    if (fetched.code !== 0) {
      console.log(yellow(`fetch를 건너뜁니다. 기준 브랜치가 낡았을 수 있어요: ${fetched.stderr.split('\n')[0]}`))
    }
  }

  // 디렉터리가 사라진 워크트리 등록을 먼저 걷어낸다. 이게 남아있으면 git이 그 브랜치의 삭제를 막는다.
  // 미리보기에서는 무엇이 걷힐지만 보여준다. --verbose는 stderr로 나온다.
  const pruned = await git(['worktree', 'prune', '--verbose', ...(values.yes ? [] : ['--dry-run'])])
  if (pruned.stderr !== '') {
    console.log(dim(pruned.stderr))
  }

  const base = await resolveBase(values.base)
  if (!base) {
    const tried = values.base ?? BASE_CANDIDATES.join(', ')

    console.error(`기준 브랜치를 찾을 수 없어요: ${tried}`)

    return 1
  }

  const worktrees = parseWorktrees(await gitOrThrow(['worktree', 'list', '--porcelain']), currentPath)
  const mainWorktree = worktrees[0]
  if (!mainWorktree) {
    console.error('워크트리 목록을 읽지 못했어요.')

    return 1
  }

  const worktreeByBranch = new Map<string, Worktree>()
  for (const worktree of worktrees) {
    if (worktree.branch) worktreeByBranch.set(worktree.branch, worktree)
  }

  const protectedBranches = new Set(ALWAYS_PROTECTED)
  protectedBranches.add(base.replace(/^origin\//, ''))
  if (mainWorktree.branch) protectedBranches.add(mainWorktree.branch)

  const mergedPrs = values['no-gh'] ? new Map<string, MergedPr>() : await loadMergedPrs(prLimit)

  const branches = (await gitOrThrow(['for-each-ref', '--format=%(refname:short)', 'refs/heads']))
    .split('\n')
    .filter((branch) => branch !== '')

  const context: ClassifyContext = {
    base,
    protectedBranches,
    mergedPrs,
    includeEmpty: values['include-empty'],
  }

  const candidates: Candidate[] = []
  for (const branch of branches) {
    const candidate: Candidate = {
      branch,
      label: branch,
      worktree: worktreeByBranch.get(branch) ?? null,
      verdict: await classifyBranch(branch, context),
    }
    candidate.verdict = await guardWorktree(candidate, values.force)
    candidates.push(candidate)
  }

  // 브랜치 순회로는 안 잡히는 워크트리다. 머지 여부를 물을 브랜치가 없으니 손대지 않고 보고만 한다.
  for (const worktree of worktrees) {
    if (worktree.branch || worktree.isMain) continue

    candidates.push({
      branch: null,
      label: `(HEAD 분리) ${worktree.head?.slice(0, 7) ?? '?'}`,
      worktree,
      verdict: { action: 'keep', reason: '브랜치가 없어 머지 여부를 알 수 없음' },
    })
  }

  const baseSha = (await gitOrThrow(['rev-parse', '--short', base])).trim()
  console.log(`기준 ${bold(base)} ${dim(baseSha)} · 워크트리 ${worktrees.length}개 · 로컬 브랜치 ${branches.length}개`)

  const doomed = candidates.filter((candidate) => candidate.verdict.action === 'delete')
  const kept = candidates.filter((candidate) => candidate.verdict.action === 'keep')

  printGroup(bold('지울 것'), doomed, mainWorktree.path)
  printGroup('남길 것', kept, mainWorktree.path)

  if (doomed.length === 0) {
    console.log(`\n${green('정리할 게 없어요.')}`)

    return 0
  }

  if (!values.yes) {
    console.log(`\n미리보기입니다. 실제로 지우려면 ${bold('--yes')}를 붙이세요.`)

    return 0
  }

  console.log('')
  let failed = 0
  for (const candidate of doomed) {
    if (!(await deleteCandidate(candidate))) failed += 1
  }

  console.log(`\n${doomed.length - failed}개 정리 완료${failed > 0 ? `, ${red(`${failed}개 실패`)}` : ''}.`)

  return failed > 0 ? 1 : 0
}

async function resolveBase(explicit: string | undefined): Promise<string | null> {
  for (const candidate of explicit ? [explicit] : BASE_CANDIDATES) {
    const verified = await git(['rev-parse', '--verify', '--quiet', `${candidate}^{commit}`])
    if (verified.code === 0) return candidate
  }

  return null
}

/** gh가 없거나 인증이 안 됐어도 멈추지 않는다. 조상·패치 신호만으로 판정을 이어간다. */
async function loadMergedPrs(limit: number): Promise<Map<string, MergedPr>> {
  const repo = await run(['gh', 'repo', 'view', '--json', 'owner'])
  if (repo.code !== 0) {
    console.log(yellow(`gh를 쓸 수 없어 PR 신호를 뺍니다: ${repo.stderr.split('\n')[0]}`))

    return new Map()
  }

  try {
    const owner = (JSON.parse(repo.stdout) as { owner: { login: string } }).owner.login

    return await fetchMergedPrs(owner, limit)
  } catch (error) {
    console.log(yellow(`머지된 PR 목록을 못 읽어 PR 신호를 뺍니다: ${error instanceof Error ? error.message : error}`))

    return new Map()
  }
}

try {
  process.exit(await main())
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  // 옵션을 잘못 쓴 사람에게 제일 필요한 건 도움말 위치다. parseArgs는 ERR_PARSE_ARGS_* 코드를 달아 던진다.
  if (error instanceof Error && String((error as { code?: string }).code).startsWith('ERR_PARSE_ARGS')) {
    console.error('사용법은 --help로 볼 수 있어요.')
  }
  process.exit(1)
}
