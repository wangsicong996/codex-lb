import { useState } from "react";
import { Boxes, CheckCircle2, Loader2, Network, Pencil, Plus, Server, Trash2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ProxyEndpointCreateDialog } from "@/features/settings/components/proxy-endpoint-create-dialog";
import { ProxyPoolCreateDialog } from "@/features/settings/components/proxy-pool-create-dialog";
import { ProxyPoolMemberDialog } from "@/features/settings/components/proxy-pool-member-dialog";
import type {
  SettingsUpdateRequest,
  UpstreamProxyAdmin,
  UpstreamProxyEndpoint,
  UpstreamProxyEndpointCreateRequest,
  UpstreamProxyEndpointUpdateRequest,
  UpstreamProxyPool,
  UpstreamProxyPoolCreateRequest,
  UpstreamProxyPoolUpdateRequest,
} from "@/features/settings/schemas";
import type {
  UpstreamProxyEndpointTestResponse,
  UpstreamProxyPoolMemberRequest,
} from "@/features/settings/schemas";
import { useDialogState } from "@/hooks/use-dialog-state";

const NO_POOL_VALUE = "__none__";

export type UpstreamProxySettingsProps = {
  admin: UpstreamProxyAdmin;
  busy: boolean;
  onSaveSettings: (payload: SettingsUpdateRequest) => Promise<void>;
  onCreateEndpoint: (payload: UpstreamProxyEndpointCreateRequest) => Promise<unknown>;
  onUpdateEndpoint: (endpointId: string, payload: UpstreamProxyEndpointUpdateRequest) => Promise<unknown>;
  onTestEndpoint: (endpointId: string) => Promise<UpstreamProxyEndpointTestResponse>;
  onDeleteEndpoint: (endpointId: string) => Promise<unknown>;
  onCreatePool: (payload: UpstreamProxyPoolCreateRequest) => Promise<unknown>;
  onUpdatePool: (poolId: string, payload: UpstreamProxyPoolUpdateRequest) => Promise<unknown>;
  onAddPoolMember: (poolId: string, payload: UpstreamProxyPoolMemberRequest) => Promise<unknown>;
  onDeletePool: (poolId: string) => Promise<unknown>;
};

export function UpstreamProxySettings({
  admin,
  busy,
  onSaveSettings,
  onCreateEndpoint,
  onUpdateEndpoint,
  onTestEndpoint,
  onDeleteEndpoint,
  onCreatePool,
  onUpdatePool,
  onAddPoolMember,
  onDeletePool,
}: UpstreamProxySettingsProps) {
  const { t } = useTranslation();
  const endpointDialog = useDialogState();
  const poolDialog = useDialogState();
  const memberDialog = useDialogState();
  const editEndpointDialog = useDialogState<UpstreamProxyEndpoint>();
  const editPoolDialog = useDialogState<UpstreamProxyPool>();
  const deleteEndpointDialog = useDialogState<UpstreamProxyEndpoint>();
  const deletePoolDialog = useDialogState<UpstreamProxyPool>();
  const [testingEndpointId, setTestingEndpointId] = useState<string | null>(null);
  const [endpointTestResults, setEndpointTestResults] = useState<Record<string, UpstreamProxyEndpointTestResponse>>({});

  const hasEndpoints = admin.endpoints.length > 0;
  const hasPools = admin.pools.length > 0;

  const testEndpoint = async (endpointId: string) => {
    if (testingEndpointId !== null) {
      return;
    }
    setTestingEndpointId(endpointId);
    try {
      const result = await onTestEndpoint(endpointId);
      setEndpointTestResults((current) => ({ ...current, [endpointId]: result }));
    } finally {
      setTestingEndpointId(null);
    }
  };

  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Network className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{t("upstreamProxy.title")}</h3>
              <p className="text-xs text-muted-foreground">{t("upstreamProxy.description")}</p>
            </div>
          </div>
          <Switch
            aria-label={t("upstreamProxy.enableAria")}
            checked={admin.routingEnabled}
            disabled={busy}
            onCheckedChange={(checked) => void onSaveSettings({ upstreamProxyRoutingEnabled: checked })}
          />
        </div>

        <div className="rounded-lg border p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{t("upstreamProxy.defaultPool.title")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("upstreamProxy.defaultPool.description")}</p>
            </div>
            <Select
              value={admin.defaultPoolId ?? NO_POOL_VALUE}
              onValueChange={(value) =>
                void onSaveSettings({ upstreamProxyDefaultPoolId: value === NO_POOL_VALUE ? null : value })
              }
              disabled={busy}
            >
              <SelectTrigger className="h-8 w-full min-w-0 text-xs sm:w-56" aria-label={t("upstreamProxy.defaultPool.aria")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_POOL_VALUE}>{t("upstreamProxy.defaultPool.none")}</SelectItem>
                {admin.pools.map((pool) => (
                  <SelectItem key={pool.id} value={pool.id}>
                    {pool.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            disabled={busy}
            onClick={() => endpointDialog.show()}
          >
            <Plus className="h-3.5 w-3.5" />
            {t("upstreamProxy.actions.addEndpoint")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs"
            disabled={busy || !hasEndpoints}
            onClick={() => poolDialog.show()}
          >
            <Boxes className="h-3.5 w-3.5" />
            {t("upstreamProxy.actions.createPool")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs"
            disabled={busy || !hasPools || !hasEndpoints}
            onClick={() => memberDialog.show()}
          >
            <Plus className="h-3.5 w-3.5" />
            {t("upstreamProxy.actions.addMember")}
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <Server className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                {t("upstreamProxy.endpoints.title")}
              </p>
              <span className="text-xs tabular-nums text-muted-foreground">{admin.endpoints.length}</span>
            </div>
            <div className="mt-2 space-y-1.5">
              {hasEndpoints ? (
                admin.endpoints.map((endpoint) => {
                  const result = endpointTestResults[endpoint.id];
                  return (
                    <div key={endpoint.id} className="space-y-1 rounded-md bg-muted/50 px-2.5 py-1.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0">
                          <span className="font-medium text-foreground">{endpoint.name}</span>
                          <span className="text-muted-foreground">
                            {" "}
                            · {endpoint.scheme}://{endpoint.username ? `${endpoint.username}@` : ""}
                            {endpoint.host}:{endpoint.port}
                          </span>
                        </span>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 px-2 text-xs"
                            disabled={busy}
                            aria-label={t("upstreamProxy.actions.editEndpoint", { name: endpoint.name })}
                            onClick={() => editEndpointDialog.show(endpoint)}
                          >
                            <Pencil className="h-3 w-3" aria-hidden="true" />
                            {t("common.actions.edit")}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
                            disabled={busy}
                            aria-label={t("upstreamProxy.actions.deleteEndpoint", { name: endpoint.name })}
                            onClick={() => deleteEndpointDialog.show(endpoint)}
                          >
                            <Trash2 className="h-3 w-3" aria-hidden="true" />
                            {t("common.actions.delete")}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            disabled={busy || testingEndpointId !== null}
                            onClick={() => void testEndpoint(endpoint.id)}
                          >
                            {testingEndpointId === endpoint.id ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" aria-hidden="true" />
                            ) : null}
                            {t("upstreamProxy.actions.test")}
                          </Button>
                        </div>
                      </div>
                      {result ? (
                        <div
                          className={
                            result.ok
                              ? "flex items-center gap-1 text-emerald-600"
                              : "flex items-center gap-1 text-destructive"
                          }
                        >
                          {result.ok ? (
                            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                          ) : (
                            <XCircle className="h-3 w-3" aria-hidden="true" />
                          )}
                          <span>
                            {result.ok
                              ? t("upstreamProxy.endpoints.connectionOk")
                              : t("upstreamProxy.endpoints.connectionFailed")}
                            {result.statusCode != null ? ` · HTTP ${result.statusCode}` : null}
                            {result.elapsedMs != null ? ` · ${result.elapsedMs}ms` : null}
                            {result.error ? ` · ${result.error}` : null}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground">{t("upstreamProxy.endpoints.empty")}</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <Boxes className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                {t("upstreamProxy.pools.title")}
              </p>
              <span className="text-xs tabular-nums text-muted-foreground">{admin.pools.length}</span>
            </div>
            <div className="mt-2 space-y-1.5">
              {hasPools ? (
                admin.pools.map((pool) => (
                  <div
                    key={pool.id}
                    className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2.5 py-1.5 text-xs"
                  >
                    <span className="min-w-0 truncate font-medium text-foreground">{pool.name}</span>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="text-muted-foreground">
                        {pool.isActive ? t("common.states.active") : t("common.states.inactive")} ·{" "}
                        {t("upstreamProxy.pools.endpointCount", { count: pool.endpointIds.length })}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 px-2 text-xs"
                        disabled={busy}
                        aria-label={t("upstreamProxy.actions.editPool", { name: pool.name })}
                        onClick={() => editPoolDialog.show(pool)}
                      >
                        <Pencil className="h-3 w-3" aria-hidden="true" />
                        {t("common.actions.edit")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
                        disabled={busy}
                        aria-label={t("upstreamProxy.actions.deletePool", { name: pool.name })}
                        onClick={() => deletePoolDialog.show(pool)}
                      >
                        <Trash2 className="h-3 w-3" aria-hidden="true" />
                        {t("common.actions.delete")}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">{t("upstreamProxy.pools.empty")}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <ProxyEndpointCreateDialog
        open={endpointDialog.open}
        busy={busy}
        onOpenChange={endpointDialog.onOpenChange}
        onSubmit={onCreateEndpoint}
      />
      <ProxyEndpointCreateDialog
        open={editEndpointDialog.open}
        busy={busy}
        endpoint={editEndpointDialog.data}
        onOpenChange={editEndpointDialog.onOpenChange}
        onSubmit={async (payload) => {
          const endpoint = editEndpointDialog.data;
          if (!endpoint) {
            return;
          }
          await onUpdateEndpoint(endpoint.id, payload);
        }}
      />
      <ProxyPoolCreateDialog
        open={poolDialog.open}
        busy={busy}
        endpoints={admin.endpoints}
        onOpenChange={poolDialog.onOpenChange}
        onSubmit={onCreatePool}
      />
      <ProxyPoolCreateDialog
        open={editPoolDialog.open}
        busy={busy}
        endpoints={admin.endpoints}
        pool={editPoolDialog.data}
        onOpenChange={editPoolDialog.onOpenChange}
        onSubmit={async (payload) => {
          const pool = editPoolDialog.data;
          if (!pool) {
            return;
          }
          await onUpdatePool(pool.id, payload);
        }}
      />
      <ProxyPoolMemberDialog
        open={memberDialog.open}
        busy={busy}
        pools={admin.pools}
        endpoints={admin.endpoints}
        onOpenChange={memberDialog.onOpenChange}
        onSubmit={onAddPoolMember}
      />
      <ConfirmDialog
        open={deleteEndpointDialog.open}
        title={t("upstreamProxy.deleteEndpoint.title")}
        description={
          deleteEndpointDialog.data
            ? t("upstreamProxy.deleteEndpoint.description", { name: deleteEndpointDialog.data.name })
            : undefined
        }
        confirmLabel={t("common.actions.delete")}
        confirmDisabled={busy}
        onOpenChange={deleteEndpointDialog.onOpenChange}
        onConfirm={() => {
          const endpoint = deleteEndpointDialog.data;
          if (!endpoint) {
            return;
          }
          void onDeleteEndpoint(endpoint.id).finally(() => {
            deleteEndpointDialog.hide();
          });
        }}
      />
      <ConfirmDialog
        open={deletePoolDialog.open}
        title={t("upstreamProxy.deletePool.title")}
        description={
          deletePoolDialog.data
            ? t("upstreamProxy.deletePool.description", { name: deletePoolDialog.data.name })
            : undefined
        }
        confirmLabel={t("common.actions.delete")}
        confirmDisabled={busy}
        onOpenChange={deletePoolDialog.onOpenChange}
        onConfirm={() => {
          const pool = deletePoolDialog.data;
          if (!pool) {
            return;
          }
          void onDeletePool(pool.id).finally(() => {
            deletePoolDialog.hide();
          });
        }}
      />
    </section>
  );
}
