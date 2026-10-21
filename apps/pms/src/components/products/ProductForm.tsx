"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@zsyio/ui";
import { Input } from "@zsyio/ui";
import { Label } from "@zsyio/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zsyio/ui";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from "@/store/api/productsApi";
import type { Product } from "@zsyio/types";
import {
  PackagePlus,
  ArrowLeft,
  Globe,
  GitBranch,
  Layers,
  Sparkles,
  Loader2,
  Box,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { ImageUploader } from "@zsyio/ui";
import { PageHeader, ConfirmDialog } from "@/components/shared";
import { useDeleteWithConfirm } from "@zsyio/ui";
import { getErrorMessage } from "@zsyio/ui";

const formSchema = z.object({
  name: z.string().min(1, "Product name is mandatory and cannot be empty"),
  imageUrl: z.string().optional().nullable(),
  version: z.string().optional(),
  deployedUrl: z.string().url("Must be a valid URL (e.g. https://...)").optional().or(z.literal("")),
  repoUrl: z.string().url("Must be a valid URL (e.g. https://...)").optional().or(z.literal("")),
  environment: z.enum(["PRODUCTION", "STAGING", "DEVELOPMENT"]),
});

type FormValues = z.infer<typeof formSchema>;

export function ProductForm({
  clientId,
  clientName,
  product,
}: {
  clientId: string;
  clientName?: string;
  product?: Product;
}) {
  const router = useRouter();
  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();
  const [submitting, setSubmitting] = useState(false);

  const {
    confirmOpen: confirmDeleteOpen,
    setConfirmOpen: setConfirmDeleteOpen,
    handleDelete: handleDeleteProduct,
  } = useDeleteWithConfirm({
    deleteTrigger: () => deleteProduct(product!.id),
    successMessage: `Product "${product?.name}" has been deleted.`,
    errorFallback: "Failed to delete product.",
    onSuccess: () => router.push(`/clients/${clientId}`),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name ?? "",
      imageUrl: product?.imageUrl ?? "",
      version: product?.version ?? "",
      deployedUrl: product?.deployedUrl ?? "",
      repoUrl: product?.repoUrl ?? "",
      environment: product?.environment ?? "PRODUCTION",
    },
  });

  const currentImageUrl = watch("imageUrl");

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      if (product) {
        await updateProduct({ id: product.id, body: values }).unwrap();
        toast.success("Product updated successfully!");
        router.push(`/products/${product.id}`);
      } else {
        const created = await createProduct({ ...values, clientId }).unwrap();
        toast.success("Product created successfully!");
        router.push(`/products/${created.id}`);
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to save product. Please check your inputs."));
    } finally {
      setSubmitting(false);
    }
  };

  const onInvalid = () => {
    toast.error("Please fill in all mandatory fields highlighted in red.");
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      <PageHeader
        title={product ? `Edit ${product.name}` : "Create New Product"}
        titleIcon={product ? <Box className="w-5 h-5" /> : <PackagePlus className="w-5 h-5" />}
        description={
          clientName
            ? `Adding a new product service for ${clientName}`
            : "Configure product environments, repositories, and build details."
        }
        breadcrumbs={
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/clients" className="hover:text-foreground transition-colors">
              Clients
            </Link>
            <span>/</span>
            <Link
              href={product ? `/products/${product.id}` : `/clients/${clientId}`}
              className="hover:text-foreground transition-colors"
            >
              {product ? product.name : (clientName ?? "Client")}
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">
              {product ? "Edit" : "New Product"}
            </span>
          </div>
        }
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push(product ? `/products/${product.id}` : `/clients/${clientId}`)}
            className="h-8 text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Cancel
          </Button>
        }
      />

      <div className="rounded-lg border border-border/80 bg-card p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Product Image / Thumbnail <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <ImageUploader
              value={currentImageUrl}
              onChange={(val) => setValue("imageUrl", val, { shouldDirty: true })}
              label="Upload Product Image"
              description="Upload a product screenshot or icon (PNG, JPG, WebP, SVG). Stored as Base64."
              aspectRatio="landscape"
              maxDimension={1200}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>
                  Product Name <span className="text-destructive font-semibold">*</span>
                </span>
                {errors.name && (
                  <span className="text-xs font-semibold text-destructive  ">
                    Mandatory
                  </span>
                )}
              </Label>
              <Input
                id="name"
                placeholder="e.g. Patient Portal, Mobile API, Billing Service..."
                {...register("name")}
                className={cn(
                  "text-xs h-9.5 rounded-lg transition-colors",
                  errors.name && "border-destructive focus-visible:ring-destructive bg-destructive/5"
                )}
                autoFocus
              />
              {errors.name && (
                <p className="text-xs font-semibold text-destructive mt-0.5 flex items-center gap-1 animate-fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.name.message}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="version" className="text-xs font-semibold text-foreground">
                Version <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="version"
                placeholder="e.g. 1.0.0 or v2.4"
                {...register("version")}
                className="text-xs h-9.5 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deployedUrl" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Deployed URL <span className="text-muted-foreground font-normal">(Optional)</span></span>
              </Label>
              <Input
                id="deployedUrl"
                placeholder="https://app.zsyio.com"
                {...register("deployedUrl")}
                className={cn(
                  "text-xs h-9.5 rounded-lg transition-colors",
                  errors.deployedUrl && "border-destructive focus-visible:ring-destructive bg-destructive/5"
                )}
              />
              {errors.deployedUrl && (
                <p className="text-xs font-semibold text-destructive mt-0.5 flex items-center gap-1 animate-fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.deployedUrl.message}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="repoUrl" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Repository URL <span className="text-muted-foreground font-normal">(Optional)</span></span>
              </Label>
              <Input
                id="repoUrl"
                placeholder="https://github.com/org/repo"
                {...register("repoUrl")}
                className={cn(
                  "text-xs h-9.5 rounded-lg transition-colors",
                  errors.repoUrl && "border-destructive focus-visible:ring-destructive bg-destructive/5"
                )}
              />
              {errors.repoUrl && (
                <p className="text-xs font-semibold text-destructive mt-0.5 flex items-center gap-1 animate-fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.repoUrl.message}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Target Environment <span className="text-destructive font-semibold">*</span></span>
            </Label>
            <Select
              value={watch("environment")}
              onValueChange={(v) => setValue("environment", v as FormValues["environment"])}
            >
              <SelectTrigger className="h-9.5 text-xs rounded-lg">
                <SelectValue placeholder="Select Environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRODUCTION">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    <span className="font-semibold text-xs">PRODUCTION</span>
                  </div>
                </SelectItem>
                <SelectItem value="STAGING">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-warning" />
                    <span className="font-semibold text-xs">STAGING</span>
                  </div>
                </SelectItem>
                <SelectItem value="DEVELOPMENT">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-notion-blue-fg" />
                    <span className="font-semibold text-xs">DEVELOPMENT</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-3 pt-5 border-t border-border/80 flex-wrap">
            {product ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={submitting || isDeleting}
                className="text-xs font-semibold h-9 px-3 rounded-lg text-destructive hover:bg-destructive/10 border-destructive/20 hover:border-destructive/40 transition-colors gap-1.5"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Delete Product</span>
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting || isDeleting}
                className="text-xs font-medium h-9 px-4 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || isDeleting}
                className="font-semibold text-xs h-9 px-5 rounded-lg gap-1.5 min-w-[130px] shadow-xs"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{product ? "Save Changes" : "Create Product"}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {product && (
        <ConfirmDialog
          open={confirmDeleteOpen}
          onOpenChange={setConfirmDeleteOpen}
          title={`Delete "${product.name}"?`}
          description="Are you sure you want to delete this product? All tasks and associated activities will be archived."
          confirmText={isDeleting ? "Deleting..." : "Delete Product"}
          cancelText="Cancel"
          variant="destructive"
          onConfirm={handleDeleteProduct}
        />
      )}
    </div>
  );
}
