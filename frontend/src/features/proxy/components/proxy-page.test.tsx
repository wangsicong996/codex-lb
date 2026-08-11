import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProxyPage } from "@/features/proxy/components/proxy-page";
import { useAuthStore } from "@/features/auth/hooks/use-auth";
import { createDashboardSettings } from "@/test/mocks/factories";

const useSettingsMock = vi.fn();
const useUpstreamProxyAdminMock = vi.fn();
const upstreamProxySettingsMock = vi.fn();

vi.mock("@/features/settings/hooks/use-settings", () => ({
  useSettings: () => useSettingsMock(),
  useUpstreamProxyAdmin: () => useUpstreamProxyAdminMock(),
}));

vi.mock("@/features/settings/components/upstream-proxy-settings", () => ({
  UpstreamProxySettings: (props: unknown) => {
    upstreamProxySettingsMock(props);
    return <div>Upstream Proxy Settings</div>;
  },
}));

describe("ProxyPage", () => {
  const settings = createDashboardSettings();
  const upstreamAdmin = {
    endpoints: [],
    pools: [],
    bindings: [],
    routingEnabled: false,
    defaultPoolId: null,
  };

  beforeEach(() => {
    useAuthStore.setState({ canWrite: true });

    useSettingsMock.mockReturnValue({
      settingsQuery: {
        data: settings,
        error: null,
      },
      updateSettingsMutation: {
        isPending: false,
        error: null,
        mutateAsync: vi.fn().mockResolvedValue(undefined),
      },
    });
    useUpstreamProxyAdminMock.mockReturnValue({
      upstreamProxyQuery: {
        data: upstreamAdmin,
        error: null,
      },
      createEndpointMutation: { isPending: false, error: null, mutateAsync: vi.fn() },
      createPoolMutation: { isPending: false, error: null, mutateAsync: vi.fn() },
      addPoolMemberMutation: { isPending: false, error: null, mutateAsync: vi.fn() },
      deleteEndpointMutation: { isPending: false, error: null, mutateAsync: vi.fn() },
      deletePoolMutation: { isPending: false, error: null, mutateAsync: vi.fn() },
      updateEndpointMutation: { isPending: false, error: null, mutateAsync: vi.fn() },
      updatePoolMutation: { isPending: false, error: null, mutateAsync: vi.fn() },
      testEndpointMutation: { isPending: false, error: null, mutateAsync: vi.fn() },
    });

    upstreamProxySettingsMock.mockReset();
  });

  it("mounts upstream proxy administration on the dedicated page", () => {
    render(<ProxyPage />);

    expect(screen.getByText("Proxy")).toBeInTheDocument();
    expect(screen.getByText("Upstream Proxy Settings")).toBeInTheDocument();
    expect(upstreamProxySettingsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        admin: upstreamAdmin,
        busy: false,
      }),
    );
  });

  it("disables upstream proxy controls for read-only guests", () => {
    useAuthStore.setState({ canWrite: false });

    render(<ProxyPage />);

    expect(
      screen.getByText(
        "You are viewing the dashboard with read-only guest access. Admin controls are disabled.",
      ),
    ).toBeInTheDocument();
    expect(upstreamProxySettingsMock).toHaveBeenCalledWith(expect.objectContaining({ busy: true }));
  });
});
