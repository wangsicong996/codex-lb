# 上游同步后重放本分叉改动（FORK REPLAY）

本文档记录：**相对原作者 [Soju06/codex-lb](https://github.com/Soju06/codex-lb) 我们改了什么**，以及下次 `git merge upstream/main`（或 rebase）之后，如何尽快把仓库再改回当前形态。

## 目标形态（我们要什么）

1. **Python 依赖打进 `bin/vendor`**，提供 `bin/codex-lb` / `bin/codex-lb-db`，并产出 `dist/codex-lb-<version>-bin.tar.gz`。
2. **CI 每次构建上传** Actions artifact：`bin-bundle`（不要靠 GitHub Release 发 bin）。
3. **去掉 Release / Release Please / Beta release** 工作流与 CI 里的 release guard。
4. **去掉 Docker / Compose / Helm** 及对应 CI、Dependabot、测试、文档页。
5. **不在本仓库提交 Flatpak manifest**（`.yml` / flathub 包）。外部 Flatpak 只消费 bin tarball；本地验证可以借用已有 Flatpak（如 Mattermost `25.08` runtime）挂载 `bin/` 跑。

## 明确不做

- 不维护 / 不提交 Flatpak 打包清单到 git。
- 不把业务逻辑（OAuth、上游代理池、路由等）做成「另一套实现」——核心尽量跟上游，分叉集中在 **交付与 CI**。
- 不手改 `CHANGELOG.md`（若上游仍用 release-please 生成，合并后按上游习惯处理即可；我们已停用 release 发布流水线）。

---

## 一、新增文件（合并上游后若丢失，整文件拷回）

| 路径 | 作用 |
|------|------|
| `scripts/package_bin_bundle.py` | `uv pip install --python 3.13 --target bin/vendor .`；写 launcher；打 `*-bin.tar.gz`；冒烟必须用 **Python 3.13**（不能用系统 `python3`，否则 `pydantic_core` ABI 不对）。 |
| `docs/deployment/bin-bundle.md` | 用户文档：从 CI artifact `bin-bundle` 下载并解压使用。 |
| `openspec/changes/flatpak-bin-bundle/**` | 本分叉的 OpenSpec change（proposal/tasks/context/delta specs）。合并上游后若冲突，以「bin + 无 Docker/Release」契约为准。 |
| `FORK_REPLAY.md`（本文件） | 重放清单。 |

### `Makefile` 需增加的目标

```makefile
package-bin: frontend-build
	uv run python scripts/package_bin_bundle.py --skip-frontend
```

并把 `package-bin` 写进 help / `.PHONY`（以及本地 `make ci` 若需要一并跑）。

### `.gitignore`

确保忽略构建产物（勿提交 vendor）：

```gitignore
dist/
bin/
```

---

## 二、删除文件 / 工作流（上游若又加回来，再次删掉）

### Docker / Helm / Compose（整树删除）

上游常见路径（名称可能略变，按实际删）：

- `Dockerfile*`、`docker-compose*.yml`、`.dockerignore`
- `deploy/helm/**`、`Chart.yaml` 及相关 values
- 容器 entrypoint / helm-smoke 脚本（若在 `scripts/` 下）
- 仅测 Docker/Helm 的单测（按上游文件名搜索 `docker`/`helm`/`compose` 后删除或改写）

### Release 相关 workflow（删除，不要改成 skip）

- `.github/workflows/release.yml`
- `.github/workflows/release-please.yml`
- `.github/workflows/prepare-beta-release.yml`
- `.github/workflows/publish-beta-release.yml`

可选清理（不挡功能，减少误用）：

- CI 里的 `beta-release-guard` / `stable-release-guard` job
- `ci-required.needs` 里对上述 guard 的引用
- `.github/CODEOWNERS` 中对已删 `release-please.yml` 的行

> 合并上游后检查 GitHub **Branch protection**：若仍要求「Beta release guard」「Stable release guard」，需在仓库设置里去掉，否则 PR 会永远等不存在的 check。

---

## 三、修改文件（按主题重放）

### 1) CI：打 bin + 上传 artifact，去掉容器 / release guard

文件：`.github/workflows/ci.yml`

重放要点：

1. **删除** docker/helm 相关 job（若上游又加回）。
2. **删除** `beta-release-guard`、`stable-release-guard` 整段，并从 `ci-required.needs` 去掉。
3. **保留 / 加入** `package-bin` job（建议每次 CI 都跑，不要只绑 backend/frontend path filter）：
   - `make package-bin`
   - 校验 `bin/codex-lb`、`bin/codex-lb-db`、`bin/vendor/app`
   - 冒烟：`PYTHONPATH=bin/vendor uv run --python 3.13 --no-project python -c "import app; import app.main"`
   - `actions/upload-artifact`：
     - `name: bin-bundle`
     - `path: dist/*-bin.tar.gz`
     - `if-no-files-found: error`
     - `retention-days: 30`（可调）
4. `ci-required.needs` **包含** `package-bin`。
5. （可选）`workflow_dispatch` 便于手动打 artifact。

参考片段（语义对齐即可，action SHA 跟上游/现网一致）：

```yaml
  package-bin:
    name: Package (bin bundle)
    runs-on: ubuntu-24.04
    needs: changes
    steps:
      # checkout + bun + uv(3.13) …
      - name: Build vendored bin bundle
        run: make package-bin
      - name: Verify bin bundle layout
        run: |
          set -euo pipefail
          test -x bin/codex-lb && test -x bin/codex-lb-db && test -d bin/vendor/app
          PYTHONPATH=bin/vendor uv run --python 3.13 --no-project python -c \
            "import app; import app.main; print('vendor import ok')"
          ls -la dist/*-bin.tar.gz
      - name: Upload bin bundle artifact
        uses: actions/upload-artifact@…   # 与仓库其它 workflow 同 pin
        with:
          name: bin-bundle
          path: dist/*-bin.tar.gz
          if-no-files-found: error
          retention-days: 30
```

### 2) Dependabot / 变更检测 / 必过 checks 标签

按上游文件实际路径调整：

| 文件 | 改动 |
|------|------|
| `.github/dependabot.yml`（或 renovate） | 去掉 `docker` / Dockerfile 生态 |
| `.github/scripts/detect_changed_areas.py` | 去掉 docker/helm 相关 area；保留 `scripts/**` 触发 backend |
| `.github/scripts/sync_codex_ok_labels.py` | `CODEX_LB_REQUIRED_CHECKS` 含 `"Package (bin bundle)"`，去掉已删的 docker/helm/release guard 名 |

### 3) 版本守卫 / release-please 配置

若上游仍带 Helm 版本字段：

- `scripts/release_versions.py`、`scripts/guard_beta_release.py`、`scripts/guard_stable_release.py`：**去掉 `Chart.yaml` / helm 字段**。
- `.github/release-please-config.json`：去掉 helm/chart 额外 package（若有）。

我们已**不跑** release-please workflow；配置文件可留着减少与上游冲突，也可删——二选一，团队统一即可。

### 4) OpenSpec / 文档（行为契约）

合并上游后，把下列契约再对齐到「bin + CI artifact、无 Docker/Release」：

| 能力 | 期望 |
|------|------|
| `openspec/specs/deployment-installation/spec.md` | vendored `bin/`；CI 上传 Actions artifact `bin-bundle`；**无** Flatpak manifest |
| `openspec/specs/release-management/spec.md` | CI artifact 交付；不要求 GitHub Release / Release Please / beta publish |
| `openspec/specs/release-automation/spec.md` | 不维护 beta sync/publish workflow |
| `openspec/specs/deployment-networking/spec.md` | 网络暴露由 host/Flatpak 运维负责；去掉 Docker/Helm 网络要求 |
| `docs/deployment/bin-bundle.md` + `mkdocs.yml` | 有 bin 页；去掉 docker/k8s 安装页（若上游加回） |
| `README.md` / `README.zh-CN.md` | Quick Start：uvx + CI `bin-bundle`；不要引导 Docker |

### 5) 其它文案

- `.github/SECURITY.md`、贡献指南里若写「Docker image / Helm chart / GitHub Release 发布 bin」，改成 **CI artifact `bin-bundle`**。

---

## 四、推荐同步流程（下次上游更新）

```text
1. git fetch upstream
2. git merge upstream/main   # 或 rebase；解决冲突时优先保留 FORK_REPLAY 所述交付策略
3. 打开本文件，按「删除清单」扫一遍上游又加回来的 Docker/Release 文件
4. 确认 scripts/package_bin_bundle.py + make package-bin + ci.yml package-bin/upload-artifact 仍在
5. 本地或 CI：make package-bin
6. 打开 Actions → 对应 run → Artifacts → bin-bundle 可下载
7. （可选）openspec validate --specs
8. 提交：chore: re-apply fork delivery delta after upstream merge
```

冲突处理优先级：

1. **应用核心**（`app/`、OAuth、proxy）→ 尽量接受上游。  
2. **交付 / CI / 文档安装路径** → 按本文件，不要回到 Docker/Release。  
3. **OpenSpec** → 规范要求与代码一致；不要留下「仍发布 Docker」的过期 SHALL。

---

## 五、验收清单

- [ ] 仓库内无 `Dockerfile*` / `deploy/helm` / compose 作为一等交付物  
- [ ] 无 release / release-please / beta publish workflow  
- [ ] CI 无 beta/stable release guard job  
- [ ] `make package-bin` 生成 `bin/vendor` + `dist/*-bin.tar.gz`  
- [ ] CI artifact 名为 `bin-bundle`  
- [ ] git 中无 Flatpak `.yml` manifest  
- [ ] `.gitignore` 含 `bin/`、`dist/`  
- [ ] 冒烟使用 **Python 3.13** 导入 `bin/vendor`

---

## 六、运行时注意（与分叉相关）

- **解释器**：vendor 内原生扩展按 3.13 构建；宿主 / Flatpak runtime 需 Python 3.13（例如 Freedesktop/`Mattermost` 的 `25.08`）。`24.08`（3.12）会 ABI 失败。  
- **上游代理**：仪表盘「默认代理池」只覆盖 ChatGPT/Codex **账户上游**；对「只访问 ChatGPT」的场景一般足够。  
- **跟上游维护**：新模型多靠 Auto Model Sync；OAuth 协议偶发变更时，合上游核心即可，再重放本交付分叉。

---

## 七、关键路径速查

```text
scripts/package_bin_bundle.py          # bin 打包
Makefile  → package-bin
.github/workflows/ci.yml               # package-bin + upload-artifact
docs/deployment/bin-bundle.md
openspec/changes/flatpak-bin-bundle/
openspec/specs/deployment-installation/spec.md
openspec/specs/release-management/spec.md
FORK_REPLAY.md                         # 本清单
```
