import { Network } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AlertMessage } from "@/components/alert-message";
import { LoadingOverlay } from "@/components/layout/loading-overlay";
import { SettingsSkeleton } from "@/features/settings/components/settings-skeleton";
import { UpstreamProxySettings } from "@/features/settings/components/upstream-proxy-settings";
import { useAuthStore } from "@/features/auth/hooks/use-auth";
import { useSettings, useUpstreamProxyAdmin } from "@/features/settings/hooks/use-settings";
import type { SettingsUpdateRequest } from "@/features/settings/schemas";
import { getErrorMessageOrNull } from "@/utils/errors";

export function ProxyPage() {
  const { t } = useTranslation();
  const { settingsQuery, updateSettingsMutation } = useSettings();
  const {
    upstreamProxyQuery,
    createEndpointMutation,
    createPoolMutation,
    addPoolMemberMutation,
    deleteEndpointMutation,
    deletePoolMutation,
    updateEndpointMutation,
    updatePoolMutation,
    testEndpointMutation,
  } = useUpstreamProxyAdmin();
  const canWrite = useAuthStore((state) => state.canWrite);

  const settings = settingsQuery.data;
  const savingBusy =
    updateSettingsMutation.isPending ||
    createEndpointMutation.isPending ||
    createPoolMutation.isPending ||
    addPoolMemberMutation.isPending ||
    deleteEndpointMutation.isPending ||
    deletePoolMutation.isPending ||
    updateEndpointMutation.isPending ||
    updatePoolMutation.isPending;
  const controlsDisabled = savingBusy || !canWrite;
  const error =
    getErrorMessageOrNull(settingsQuery.error) ||
    getErrorMessageOrNull(upstreamProxyQuery.error) ||
    getErrorMessageOrNull(updateSettingsMutation.error) ||
    getErrorMessageOrNull(createEndpointMutation.error) ||
    getErrorMessageOrNull(createPoolMutation.error) ||
    getErrorMessageOrNull(addPoolMemberMutation.error) ||
    getErrorMessageOrNull(deleteEndpointMutation.error) ||
    getErrorMessageOrNull(deletePoolMutation.error) ||
    getErrorMessageOrNull(updateEndpointMutation.error) ||
    getErrorMessageOrNull(updatePoolMutation.error) ||
    getErrorMessageOrNull(testEndpointMutation.error);

  const handleSave = async (payload: SettingsUpdateRequest) => {
    await updateSettingsMutation.mutateAsync(payload);
  };

  return (
    <div className="animate-fade-in-up space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Network className="h-5 w-5 text-primary" />
          {t("proxy.page.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("proxy.page.subtitle")}</p>
      </div>

      {!settings || !upstreamProxyQuery.data ? (
        <SettingsSkeleton />
      ) : (
        <>
          {error ? <AlertMessage variant="error">{error}</AlertMessage> : null}
          {!canWrite ? (
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-medium text-foreground">
              {t("settings.page.readOnlyNotice")}
            </div>
          ) : null}

          <UpstreamProxySettings
            admin={upstreamProxyQuery.data}
            busy={controlsDisabled}
            onSaveSettings={handleSave}
            onCreateEndpoint={(payload) => createEndpointMutation.mutateAsync(payload)}
            onUpdateEndpoint={(endpointId, payload) =>
              updateEndpointMutation.mutateAsync({ endpointId, payload })
            }
            onTestEndpoint={(endpointId) => testEndpointMutation.mutateAsync(endpointId)}
            onDeleteEndpoint={(endpointId) => deleteEndpointMutation.mutateAsync(endpointId)}
            onCreatePool={(payload) => createPoolMutation.mutateAsync(payload)}
            onUpdatePool={(poolId, payload) => updatePoolMutation.mutateAsync({ poolId, payload })}
            onAddPoolMember={(poolId, payload) => addPoolMemberMutation.mutateAsync({ poolId, payload })}
            onDeletePool={(poolId) => deletePoolMutation.mutateAsync(poolId)}
          />

          <LoadingOverlay visible={savingBusy} label={t("settings.page.savingLabel")} />
        </>
      )}
    </div>
  );
}
