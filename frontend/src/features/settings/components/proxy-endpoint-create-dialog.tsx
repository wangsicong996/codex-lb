import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  UpstreamProxyEndpoint,
  UpstreamProxyEndpointCreateRequest,
  UpstreamProxyEndpointUpdateRequest,
} from "@/features/settings/schemas";

const SCHEME_OPTIONS = ["http", "https", "socks5", "socks5h"] as const;

type FormValues = {
  name: string;
  scheme: (typeof SCHEME_OPTIONS)[number];
  host: string;
  port: string;
  username: string;
  password: string;
};

export type ProxyEndpointCreateDialogProps = {
  open: boolean;
  busy: boolean;
  endpoint?: UpstreamProxyEndpoint | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    payload: UpstreamProxyEndpointCreateRequest | UpstreamProxyEndpointUpdateRequest,
  ) => Promise<unknown>;
};

type ProxyEndpointCreateFormProps = {
  busy: boolean;
  endpoint?: UpstreamProxyEndpoint | null;
  onClose: () => void;
  onSubmit: (
    payload: UpstreamProxyEndpointCreateRequest | UpstreamProxyEndpointUpdateRequest,
  ) => Promise<unknown>;
};

function ProxyEndpointCreateForm({ busy, endpoint, onClose, onSubmit }: ProxyEndpointCreateFormProps) {
  const { t } = useTranslation();
  const editing = endpoint != null;
  const formSchema = z.object({
    name: z.string().trim().min(1, t("upstreamProxy.validation.nameRequired")),
    scheme: z.enum(SCHEME_OPTIONS),
    host: z.string().trim().min(1, t("upstreamProxy.validation.hostRequired")),
    port: z.string().refine((value) => {
      const parsed = Number(value);
      return Number.isInteger(parsed) && parsed >= 1 && parsed <= 65535;
    }, t("upstreamProxy.validation.portInvalid")),
    username: z.string(),
    password: z.string(),
  });
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: endpoint?.name ?? "",
      scheme: endpoint?.scheme ?? "http",
      host: endpoint?.host ?? "",
      port: endpoint ? String(endpoint.port) : "8080",
      username: endpoint?.username ?? "",
      password: "",
    },
  });

  const handleSubmit = async (values: FormValues) => {
    const username = values.username.trim();
    const payload: UpstreamProxyEndpointCreateRequest | UpstreamProxyEndpointUpdateRequest = {
      name: values.name.trim(),
      scheme: values.scheme,
      host: values.host.trim(),
      port: Number(values.port),
      username: username ? username : null,
      password: values.password ? values.password : null,
      isActive: endpoint?.isActive ?? true,
    };

    try {
      await onSubmit(payload);
    } catch {
      return;
    }

    onClose();
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("apiKeys.table.name")}</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" placeholder={t("upstreamProxy.endpointDialog.placeholders.name")} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
          <FormField
            control={form.control}
            name="scheme"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("upstreamProxy.endpointDialog.scheme")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SCHEME_OPTIONS.map((scheme) => (
                      <SelectItem key={scheme} value={scheme}>
                        {scheme}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="host"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("upstreamProxy.endpointDialog.host")}</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="off" placeholder="proxy.example.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="port"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("upstreamProxy.endpointDialog.port")}</FormLabel>
              <FormControl>
                <Input {...field} inputMode="numeric" autoComplete="off" placeholder="8080" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("upstreamProxy.endpointDialog.username")}</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="off" placeholder={t("upstreamProxy.optional")} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.login.passwordLabel")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    autoComplete="new-password"
                    placeholder={
                      editing ? t("upstreamProxy.endpointDialog.passwordKeep") : t("upstreamProxy.optional")
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter className="mt-2">
          <Button type="submit" disabled={busy || form.formState.isSubmitting}>
            {editing ? t("upstreamProxy.actions.saveEndpoint") : t("upstreamProxy.actions.createEndpoint")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function ProxyEndpointCreateDialog({
  open,
  busy,
  endpoint = null,
  onOpenChange,
  onSubmit,
}: ProxyEndpointCreateDialogProps) {
  const { t } = useTranslation();
  const editing = endpoint != null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("upstreamProxy.endpointDialog.editTitle") : t("upstreamProxy.endpointDialog.title")}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? t("upstreamProxy.endpointDialog.editDescription")
                : t("upstreamProxy.endpointDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <ProxyEndpointCreateForm
            key={endpoint?.id ?? "create"}
            busy={busy}
            endpoint={endpoint}
            onClose={() => onOpenChange(false)}
            onSubmit={onSubmit}
          />
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
