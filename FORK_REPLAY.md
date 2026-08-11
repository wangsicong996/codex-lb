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
- **交付 / CI** 上不要回到 Docker / Release；核心业务尽量跟上游。
- **例外**：本分叉曾补过上游 dashboard 代理池缺口（见下方「八」）。若上游之后提供了**同等或更好**的删除/编辑/代理健壮性实现，合入时**接受上游、丢掉我们的补丁**，不要为了「重放本文件」而反向覆盖上游更好的方案。
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
5. 对照「八」：上游若已有更好的代理池删除/编辑/死连接方案 → 用上游；否则才重放我们的补丁
6. 本地或 CI：make package-bin
7. 打开 Actions → 对应 run → Artifacts → bin-bundle 可下载
8. （可选）openspec validate --specs
9. 提交：chore: re-apply fork delivery delta after upstream merge
```

冲突处理优先级：

1. **应用核心**（`app/`、OAuth、proxy）→ 尽量接受上游。  
2. **交付 / CI / 文档安装路径** → 按本文件，不要回到 Docker/Release。  
3. **OpenSpec** → 规范要求与代码一致；不要留下「仍发布 Docker」的过期 SHALL。  
4. **第八节列出的代理池 UX / 健壮性补丁** → 仅当上游**仍缺**该能力时才重放；上游已有更完整实现时**不要**再套我们的旧补丁。

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
- **上游代理**：仪表盘「默认代理池」只覆盖 ChatGPT/Codex **账户上游**；对「只访问 ChatGPT」的场景一般足够。管理入口在核心导航 **代理**（`/proxy`，设置右侧），不再埋在设置 → 高级。Dashboard「测试」经 proxy 访问 `https://chatgpt.com/cdn-cgi/trace`（不是 ICMP ping，也不是只测端口监听）。OpenWrt 上同一线路 **SOCKS5 往往比 HTTP 代理入站更稳**——运维侧优先 SOCKS，不必在分叉里硬改探测目标。  
- **跟上游维护**：新模型多靠 Auto Model Sync；OAuth 协议偶发变更时，合上游核心即可，再重放本交付分叉；代理池删除/编辑/死连接重试见第八节。

---

## 七、关键路径速查

```text
scripts/package_bin_bundle.py          # bin 打包
Makefile  → package-bin
.github/workflows/ci.yml               # package-bin + upload-artifact
docs/deployment/bin-bundle.md
openspec/changes/flatpak-bin-bundle/
openspec/changes/fix-upstream-proxy-stale-reuse-and-delete/
openspec/specs/deployment-installation/spec.md
openspec/specs/release-management/spec.md
FORK_REPLAY.md                         # 本清单
```

---

## 八、应用层补丁：上游代理池删除 / 编辑 / 死连接（可能被上游更好实现取代）

> **合上游口令**：原作者后续很可能补上「删除/编辑 endpoint·pool」以及更完整的 proxy 健壮性。合并前先在上游 `main` 搜是否已有等价 API/UI。  
> - 上游**已有且质量不低于本分叉** → **整段丢掉我们的补丁，用上游**（不要反向「优化」回去）。  
> - 上游**仍缺** → 再按下列清单重放。  
> OpenSpec change 目录：`openspec/changes/fix-upstream-proxy-stale-reuse-and-delete/`（若已 archive，到 `openspec/changes/archive/` 找同名）。

### 我们补了什么（能力清单）

| 能力 | 本分叉行为 | 合上游时如何判断「可以不重放」 |
|------|------------|--------------------------------|
| 删除 endpoint | `DELETE /api/settings/upstream-proxy/endpoints/{id}` + Dashboard「删除」 | 上游已有 delete endpoint API + UI |
| 删除 pool | `DELETE /api/settings/upstream-proxy/pools/{id}`；有账户 binding 时 `proxy_pool_in_use`；清 route/settings cache | 上游已有 delete pool + binding 护栏 |
| 编辑 endpoint | `PUT .../endpoints/{id}`；密码留空则保持原密码；响应不回显密码 | 上游已有 update endpoint（含密码策略） |
| 编辑 pool | `PUT .../pools/{id}`；`endpoint_ids` **整体替换**成员 | 上游已有 update pool / 重排成员 |
| Dashboard UX | 每行按钮顺序：**编辑 → 删除 → 测试**；创建/编辑共用对话框；入口在核心导航 **代理** `/proxy` | 上游已有编辑入口（不论在 Settings 还是独立页） |
| 测试不挡保存遮罩 | `testEndpointMutation` **不计入**全页「保存设置中…」`savingBusy` | 上游已把 probe 与 settings save overlay 拆开 |
| HTTP 代理死连接 | `ServerDisconnectedError` / 非 connector `ClientOSError` 时同 endpoint **重试一次**；`ServerDisconnectedError` 计入 pre-dispatch 便于同池 fallback；`create_codex_session` `enable_cleanup_closed=True` | 上游已有等价 reconnect / 更完整的连接池轮换或健康策略 |

### 重放时优先看的路径

```text
app/modules/settings/api.py              # DELETE/PUT endpoints & pools
app/modules/settings/schemas.py          # UpdateRequest 模型
app/core/clients/codex.py                # _request_via_http_proxy 死连接重试
app/core/resilience/network_recovery.py  # is_stale_proxy_keep_alive_failure；ServerDisconnected pre-dispatch
frontend/src/features/settings/api.ts
frontend/src/features/settings/hooks/use-settings.ts
frontend/src/features/proxy/components/proxy-page.tsx                 # `/proxy` 页；savingBusy 不含 test
frontend/src/features/settings/components/upstream-proxy-settings.tsx # 编辑/删除/测试（挂在 Proxy 页）
frontend/src/features/settings/components/proxy-endpoint-create-dialog.tsx  # 编辑模式
frontend/src/features/settings/components/proxy-pool-create-dialog.tsx      # 编辑模式
frontend/src/components/layout/app-header.tsx                        # 核心导航含 Proxy（设置右侧）
frontend/src/i18n/locales/{en,zh-CN,ko}.json
tests/integration/test_settings_api.py   # delete/update 用例
tests/unit/test_codex_client.py          # stale keep-alive 用例
openspec/changes/move-upstream-proxy-to-nav-tab/  # 上游代理 UI 迁到独立「代理」tab
```

### 不要做的事（避免反向优化）

1. **不要**在上游已合并官方 CRUD 后，再把我们的旧 OpenSpec/API 形状强行盖回去。  
2. **不要**把「测试遮罩 bugfix」当成永久分叉逻辑——上游修了同样问题即可删除我们的 `savingBusy` 特例。  
3. **不要**假设我们的「同 endpoint 重试一次」优于上游未来的连接池 generation 轮换 / endpoint health；有更系统的方案就跟上游。  
4. **不要**把 OpenWrt HTTP vs SOCKS 运维结论写进产品默认（探测 URL、强制 SOCKS）——那是部署侧选择，不是分叉契约。
