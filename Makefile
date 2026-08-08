PYTEST_ARGS := -q -ra -o faulthandler_timeout=300 -o faulthandler_exit_on_timeout=true --timeout=180 --timeout-method=thread --durations=20
POSTGRES_TEST_DATABASE_URL ?= postgresql+asyncpg://codex_lb:codex_lb@127.0.0.1:5432/codex_lb
INTEGRATION_CORE_SHARD_COUNT := 3
POSTGRES_PYTEST_TARGETS := \
	tests/integration/test_migrations.py::test_postgresql_migration_contract_policy_and_drift_match \
	tests/integration/test_migrations.py::test_postgresql_upgrade_head_from_empty_database \
	tests/integration/test_migrations.py::test_postgresql_startup_migration_auto_remap_legacy_head \
	tests/integration/test_migration_serialization.py::test_concurrent_upgrades_on_fresh_postgresql_database_apply_head_exactly_once \
	tests/integration/test_migration_serialization.py::test_postgresql_run_upgrade_times_out_when_advisory_lock_is_held \
	tests/integration/test_usage_repository.py::test_latest_by_account_primary_query_plan_uses_normalized_window_index_postgresql \
	tests/integration/test_automations_history_queries.py \
	tests/integration/test_repositories.py::test_accounts_upsert_with_merge_enabled_serializes_concurrent_same_email \
	tests/integration/test_sticky_sessions_api.py::test_durable_bridge_owned_alias_registration_is_epoch_fenced \
	tests/integration/test_proxy_api_extended.py::test_proxy_stream_usage_limit_returns_http_error \
	tests/integration/test_api_keys_api.py::test_rate_limit_header_failure_releases_reservation_once \
	tests/integration/test_codex_usage_api.py::test_codex_usage_aggregates_windows \
	tests/integration/test_proxy_compact.py::test_proxy_compact_headers_include_monthly_only_credits \
	tests/integration/test_repositories.py::test_accounts_upsert_with_merge_disabled_uses_identity_lock_on_postgresql \
	tests/integration/test_db_session_timezone.py \
	tests/integration/test_db_commit_durability.py \
	tests/test_request_logs_options_api.py \
	tests/integration/test_account_usage_rollup.py \
	tests/integration/test_request_usage_time_rollup.py \
	tests/integration/test_request_usage_rollup_parity.py \
	tests/integration/test_migrations.py::test_request_usage_time_rollups_migration_upgrade_and_downgrade \
	tests/integration/test_migrations.py::test_conversation_presence_rollup_migration_upgrade_and_downgrade \
	tests/integration/test_data_retention.py \
	tests/integration/test_plan_downgrade_observation_store.py \
	tests/integration/test_accounts_api_probe.py::test_force_probe_confirms_paid_to_free_plan_downgrade \
	tests/integration/test_accounts_api_probe.py::test_force_probe_keeps_paid_plan_for_unrecognized_payload_plan \
	tests/integration/test_accounts_api_probe.py::test_pending_downgrade_evidence_is_persisted_for_all_replicas \
	tests/integration/test_accounts_api_probe.py::test_reimport_clears_pending_downgrade_evidence \
	tests/integration/test_repositories.py::test_replace_reauthorized_discards_pending_downgrade_evidence \
	tests/integration/test_repositories.py::test_upsert_account_slot_discards_pending_downgrade_evidence_on_reimport \
	tests/integration/test_migrations.py::test_account_plan_downgrade_observations_migration_upgrade_and_downgrade
SHELL := /bin/bash

.PHONY: help
help:
	@printf '%s\n' \
	  'Common targets:' \
	  '  make lint                    ruff check + format check + architecture checks' \
	  '  make architecture-check      proxy architecture fitness ratchets' \
	  '  make typecheck               ty check' \
	  '  make frontend-test           vitest coverage, same as CI' \
	  '  make test-dashboard-browser-smoke  built dashboard against the real local API' \
	  '  make test-unit               unit pytest slice, same as CI' \
	  '  make test-integration-core   integration-core pytest slice' \
	  '  make package                 build and verify sdist/wheel' \
	  '  make package-bin             vendor deps into bin/ + tarball' \
	  '  make ci-fast                 lint/type/frontend/unit/package' \
	  '  make ci                      full local CI gate'

.PHONY: frontend-install frontend-lint frontend-typecheck frontend-test frontend-test-fast frontend-build \
	frontend-playwright-chromium test-dashboard-browser-smoke
frontend-install:
	cd frontend && bun install --frozen-lockfile

frontend-lint: frontend-install
	cd frontend && bun run lint

frontend-typecheck: frontend-install
	cd frontend && bun run typecheck

frontend-test: frontend-install
	cd frontend && bun run test:coverage

frontend-test-fast: frontend-install
	cd frontend && bun run test

frontend-build: frontend-install
	cd frontend && bun run build

frontend-playwright-chromium: frontend-install
	cd frontend && bun run playwright install chromium

test-dashboard-browser-smoke: frontend-build frontend-playwright-chromium
	uv sync --dev --frozen
	uv run python scripts/run_dashboard_browser_smoke.py

.PHONY: lint typecheck architecture-check
lint: architecture-check
	uv run ruff check .
	uv run ruff format --check .

architecture-check:
	python scripts/check_proxy_architecture.py

typecheck:
	uv sync --dev --frozen
	uv run ty check

.PHONY: test-unit test-integration-core test-integration-core-shard \
	test-integration-core-1 test-integration-core-2 test-integration-core-3 \
	test-integration-bridge test-e2e test-postgres
test-unit: frontend-build
	uv sync --dev --frozen
	PYTHONFAULTHANDLER=1 uv run pytest $(PYTEST_ARGS) tests/unit tests/test_request_logs_options_api.py

test-integration-core: frontend-build
	uv sync --dev --frozen
	PYTHONFAULTHANDLER=1 uv run pytest $(PYTEST_ARGS) tests/integration \
	  --ignore=tests/integration/test_http_responses_bridge.py \
	  --ignore=tests/integration/test_proxy_websocket_responses.py

# CI splits integration-core into deterministic shards (test-count-weighted
# greedy assignment; see .github/scripts/pytest_shards.py). The --verify call
# guards that the shards always partition the full selection exactly.
test-integration-core-shard: frontend-build
	uv sync --dev --frozen
	python .github/scripts/pytest_shards.py --shard-count $(INTEGRATION_CORE_SHARD_COUNT) --verify
	PYTHONFAULTHANDLER=1 uv run pytest $(PYTEST_ARGS) \
	  $$(python .github/scripts/pytest_shards.py --shard-count $(INTEGRATION_CORE_SHARD_COUNT) --shard $(SHARD))

test-integration-core-1:
	$(MAKE) test-integration-core-shard SHARD=1

test-integration-core-2:
	$(MAKE) test-integration-core-shard SHARD=2

test-integration-core-3:
	$(MAKE) test-integration-core-shard SHARD=3

test-integration-bridge: frontend-build
	uv sync --dev --frozen
	PYTHONFAULTHANDLER=1 uv run pytest $(PYTEST_ARGS) -vv \
	  tests/integration/test_http_responses_bridge.py \
	  tests/integration/test_proxy_websocket_responses.py

test-e2e: frontend-build
	uv sync --dev --frozen
	PYTHONFAULTHANDLER=1 uv run pytest $(PYTEST_ARGS) tests/e2e

test-postgres:
	uv sync --dev --frozen
	CODEX_LB_TEST_DATABASE_URL="$${CODEX_LB_TEST_DATABASE_URL:-$(POSTGRES_TEST_DATABASE_URL)}" \
	  PYTHONFAULTHANDLER=1 \
	  uv run pytest $(PYTEST_ARGS) $(POSTGRES_PYTEST_TARGETS)

.PHONY: migration-check migration-check-postgres
migration-check:
	uv sync --dev --frozen
	TMP_DB="$$(mktemp -u /tmp/codex-lb-ci-migrate-XXXXXX.db)"; \
	DB_URL="sqlite+aiosqlite:///$${TMP_DB}"; \
	trap 'rm -f "$${TMP_DB}"' EXIT; \
	uv run codex-lb-db --db-url "$${DB_URL}" upgrade head; \
	uv run codex-lb-db --db-url "$${DB_URL}" check

migration-check-postgres:
	uv sync --dev --frozen
	uv run codex-lb-db --db-url "$(POSTGRES_TEST_DATABASE_URL)" upgrade head
	uv run codex-lb-db --db-url "$(POSTGRES_TEST_DATABASE_URL)" check

.PHONY: package package-bin
package: frontend-build
	uv sync --frozen --no-dev
	uv run python -c "import app; import app.main; print('import ok')"
	rm -rf build dist *.egg-info
	uvx --from build==1.3.0 python -m build
	python scripts/verify-wheel-assets.py

package-bin: frontend-build
	uv run python scripts/package_bin_bundle.py --skip-frontend

.PHONY: ci-fast ci
ci-fast: lint typecheck frontend-test test-unit package

ci: frontend-lint frontend-typecheck frontend-test frontend-build lint typecheck \
	test-unit test-integration-core test-integration-bridge test-e2e test-postgres \
	migration-check migration-check-postgres package package-bin
