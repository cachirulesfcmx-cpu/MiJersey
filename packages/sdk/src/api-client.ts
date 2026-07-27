import type { ApiErrorResponse, HealthCheckResult } from '@mijersey/shared-types';

import type {
  AuditLogEntry,
  ChangePasswordInput,
  CreateStaffUserInput,
  DashboardMetrics,
  ListUsersParams,
  PaginatedResult,
  QueryAuditLogParams,
  RoleSummary,
  StaffMember,
  UpdateProfileInput,
} from './admin.types.js';
import type {
  AssignAttributeInput,
  Attribute,
  AttributeFilterInput,
  BulkAssignAttributesInput,
  CreateAttributeInput,
  FacetResult,
  ListAttributesParams,
  ProductAttributeAssignment,
  ProductAttributeView,
  ProductSearchSummary,
  SearchProductsParams,
  UpdateAttributeInput,
} from './attribute.types.js';
import type {
  AuthenticatedUser,
  AuthSession,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  RoleName,
  SessionSummary,
  UserProfile,
} from './auth.types.js';
import type {
  CreateProductInput,
  ListProductsParams,
  ListPublicProductsParams,
  Product,
  ProductStatus,
  UpdateProductInput,
} from './catalog.types.js';
import type {
  AdjustInventoryInput,
  CreateWarehouseInput,
  InventoryItem,
  InventoryListItem,
  InventoryMovement,
  ListInventoryParams,
  ListMovementsParams,
  ListWarehousesParams,
  ReservationReferenceInput,
  SetSafetyStockInput,
  UpdateWarehouseInput,
  Warehouse,
} from './inventory.types.js';
import type {
  Category,
  CategoryTreeNode,
  Collection,
  CollectionRuleMatchType,
  CollectionRuleValue,
  CollectionWithProducts,
  CreateCategoryInput,
  CreateCollectionInput,
  ListCollectionsParams,
  ProductPageParams,
  UpdateCategoryInput,
  UpdateCollectionInput,
} from './taxonomy.types.js';
import type {
  BulkUpdateVariantsInput,
  CreateProductOptionInput,
  CreateProductVariantInput,
  GenerateVariantsInput,
  GenerateVariantsResult,
  ListVariantsParams,
  ProductOption,
  ProductVariant,
  UpdateProductOptionInput,
  UpdateProductVariantInput,
} from './variant.types.js';

const HTTP_NO_CONTENT = 204;

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

export interface ApiRequestOptions extends RequestInit {
  accessToken?: string;
}

function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      search.set(key, String(value));
    }
  }

  const query = search.toString();
  return query ? `?${query}` : '';
}

/**
 * Thin, typed wrapper around the MiJersey API. Endpoint-specific methods are
 * added as domain APIs are implemented.
 */
export class ApiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    // `fetch` es un método de Window: si se invoca como `this.fetchImpl(...)` sin
    // enlazar, el receptor cambia y los navegadores lanzan "Illegal invocation".
    this.fetchImpl = options.fetchImpl ?? fetch.bind(globalThis);
  }

  async request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const { accessToken, headers, ...rest } = options;

    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...rest,
      // Necesario para que el refresh token (cookie httpOnly) viaje entre
      // el origen del frontend y el de la API.
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as ApiErrorResponse | null;
      throw new ApiClientError(
        body?.error.message ?? response.statusText,
        response.status,
        body?.error.code ?? 'UNKNOWN_ERROR',
        body?.error.requestId,
      );
    }

    if (response.status === HTTP_NO_CONTENT) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  getHealth(): Promise<HealthCheckResult> {
    return this.request<HealthCheckResult>('/health');
  }

  register(input: RegisterInput): Promise<UserProfile> {
    return this.request<UserProfile>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  login(input: LoginInput): Promise<AuthSession> {
    return this.request<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  refresh(): Promise<AuthSession> {
    return this.request<AuthSession>('/auth/refresh', { method: 'POST' });
  }

  logout(accessToken: string): Promise<void> {
    return this.request<void>('/auth/logout', { method: 'POST', accessToken });
  }

  forgotPassword(email: string): Promise<void> {
    return this.request<void>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  resetPassword(input: ResetPasswordInput): Promise<void> {
    return this.request<void>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  changePassword(accessToken: string, input: ChangePasswordInput): Promise<void> {
    return this.request<void>('/auth/change-password', {
      method: 'POST',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  verifyEmail(token: string): Promise<void> {
    return this.request<void>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  resendVerification(email: string): Promise<void> {
    return this.request<void>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  me(accessToken: string): Promise<AuthenticatedUser> {
    return this.request<AuthenticatedUser>('/auth/me', { accessToken });
  }

  updateProfile(accessToken: string, input: UpdateProfileInput): Promise<AuthenticatedUser> {
    return this.request<AuthenticatedUser>('/auth/profile', {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  listSessions(accessToken: string): Promise<SessionSummary[]> {
    return this.request<SessionSummary[]>('/sessions', { accessToken });
  }

  revokeSession(accessToken: string, sessionId: string): Promise<void> {
    return this.request<void>(`/sessions/${sessionId}`, { method: 'DELETE', accessToken });
  }

  revokeAllSessions(accessToken: string): Promise<void> {
    return this.request<void>('/sessions', { method: 'DELETE', accessToken });
  }

  listStaffUsers(
    accessToken: string,
    params: ListUsersParams = {},
  ): Promise<PaginatedResult<StaffMember>> {
    const query = toQueryString({
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      role: params.role,
    });
    return this.request<PaginatedResult<StaffMember>>(`/admin/users${query}`, { accessToken });
  }

  createStaffUser(accessToken: string, input: CreateStaffUserInput): Promise<StaffMember> {
    return this.request<StaffMember>('/admin/users', {
      method: 'POST',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  updateStaffUserRole(accessToken: string, userId: string, role: RoleName): Promise<void> {
    return this.request<void>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify({ role }),
    });
  }

  setStaffUserActive(accessToken: string, userId: string, isActive: boolean): Promise<void> {
    return this.request<void>(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify({ isActive }),
    });
  }

  listRoles(accessToken: string): Promise<RoleSummary[]> {
    return this.request<RoleSummary[]>('/admin/roles', { accessToken });
  }

  getDashboardMetrics(accessToken: string): Promise<DashboardMetrics> {
    return this.request<DashboardMetrics>('/admin/dashboard/metrics', { accessToken });
  }

  getRecentActivity(accessToken: string): Promise<AuditLogEntry[]> {
    return this.request<AuditLogEntry[]>('/admin/dashboard/activity', { accessToken });
  }

  queryAuditLog(
    accessToken: string,
    params: QueryAuditLogParams = {},
  ): Promise<PaginatedResult<AuditLogEntry>> {
    const query = toQueryString({
      page: params.page,
      pageSize: params.pageSize,
      action: params.action,
      userId: params.userId,
      fromDate: params.fromDate,
      toDate: params.toDate,
    });
    return this.request<PaginatedResult<AuditLogEntry>>(`/admin/audit-log${query}`, {
      accessToken,
    });
  }

  listProducts(
    accessToken: string,
    params: ListProductsParams = {},
  ): Promise<PaginatedResult<Product>> {
    const query = toQueryString({
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      status: params.status,
      visibility: params.visibility,
      type: params.type,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
    });
    return this.request<PaginatedResult<Product>>(`/admin/products${query}`, { accessToken });
  }

  getProduct(accessToken: string, id: string): Promise<Product> {
    return this.request<Product>(`/admin/products/${id}`, { accessToken });
  }

  createProduct(accessToken: string, input: CreateProductInput): Promise<Product> {
    return this.request<Product>('/admin/products', {
      method: 'POST',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  updateProduct(accessToken: string, id: string, input: UpdateProductInput): Promise<Product> {
    return this.request<Product>(`/admin/products/${id}`, {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  publishProduct(accessToken: string, id: string): Promise<void> {
    return this.request<void>(`/admin/products/${id}/publish`, { method: 'PATCH', accessToken });
  }

  archiveProduct(accessToken: string, id: string): Promise<void> {
    return this.request<void>(`/admin/products/${id}/archive`, { method: 'PATCH', accessToken });
  }

  duplicateProduct(accessToken: string, id: string): Promise<Product> {
    return this.request<Product>(`/admin/products/${id}/duplicate`, {
      method: 'POST',
      accessToken,
    });
  }

  deleteProduct(accessToken: string, id: string): Promise<void> {
    return this.request<void>(`/admin/products/${id}`, { method: 'DELETE', accessToken });
  }

  bulkUpdateProductStatus(
    accessToken: string,
    ids: string[],
    status: ProductStatus,
  ): Promise<void> {
    return this.request<void>('/admin/products/bulk/status', {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify({ ids, status }),
    });
  }

  bulkDeleteProducts(accessToken: string, ids: string[]): Promise<void> {
    return this.request<void>('/admin/products/bulk/delete', {
      method: 'POST',
      accessToken,
      body: JSON.stringify({ ids }),
    });
  }

  listPublicProducts(params: ListPublicProductsParams = {}): Promise<PaginatedResult<Product>> {
    const query = toQueryString({
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
    });
    return this.request<PaginatedResult<Product>>(`/products${query}`);
  }

  getPublicProduct(slug: string): Promise<Product> {
    return this.request<Product>(`/products/${slug}`);
  }

  getCategoryTree(accessToken: string): Promise<CategoryTreeNode[]> {
    return this.request<CategoryTreeNode[]>('/admin/categories', { accessToken });
  }

  getCategory(accessToken: string, id: string): Promise<Category> {
    return this.request<Category>(`/admin/categories/${id}`, { accessToken });
  }

  getCategoryPath(accessToken: string, id: string): Promise<Category[]> {
    return this.request<Category[]>(`/admin/categories/${id}/path`, { accessToken });
  }

  createCategory(accessToken: string, input: CreateCategoryInput): Promise<Category> {
    return this.request<Category>('/admin/categories', {
      method: 'POST',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  updateCategory(accessToken: string, id: string, input: UpdateCategoryInput): Promise<Category> {
    return this.request<Category>(`/admin/categories/${id}`, {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  moveCategory(accessToken: string, id: string, parentId: string | null): Promise<Category> {
    return this.request<Category>(`/admin/categories/${id}/move`, {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify({ parentId }),
    });
  }

  reorderCategories(
    accessToken: string,
    parentId: string | null,
    orderedIds: string[],
  ): Promise<void> {
    return this.request<void>('/admin/categories/reorder', {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify({ parentId, orderedIds }),
    });
  }

  deleteCategory(accessToken: string, id: string): Promise<void> {
    return this.request<void>(`/admin/categories/${id}`, { method: 'DELETE', accessToken });
  }

  assignProductsToCategory(
    accessToken: string,
    categoryId: string,
    productIds: string[],
  ): Promise<void> {
    return this.request<void>(`/admin/categories/${categoryId}/products`, {
      method: 'POST',
      accessToken,
      body: JSON.stringify({ productIds }),
    });
  }

  removeProductFromCategory(
    accessToken: string,
    categoryId: string,
    productId: string,
  ): Promise<void> {
    return this.request<void>(`/admin/categories/${categoryId}/products/${productId}`, {
      method: 'DELETE',
      accessToken,
    });
  }

  getPublicCategoryTree(): Promise<CategoryTreeNode[]> {
    return this.request<CategoryTreeNode[]>('/categories');
  }

  listCollections(
    accessToken: string,
    params: ListCollectionsParams = {},
  ): Promise<PaginatedResult<Collection>> {
    const query = toQueryString({
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      status: params.status,
      type: params.type,
    });
    return this.request<PaginatedResult<Collection>>(`/admin/collections${query}`, { accessToken });
  }

  getCollection(
    accessToken: string,
    id: string,
    params: ProductPageParams = {},
  ): Promise<CollectionWithProducts> {
    const query = toQueryString({ page: params.page, pageSize: params.pageSize });
    return this.request<CollectionWithProducts>(`/admin/collections/${id}${query}`, {
      accessToken,
    });
  }

  createCollection(accessToken: string, input: CreateCollectionInput): Promise<Collection> {
    return this.request<Collection>('/admin/collections', {
      method: 'POST',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  updateCollection(
    accessToken: string,
    id: string,
    input: UpdateCollectionInput,
  ): Promise<Collection> {
    return this.request<Collection>(`/admin/collections/${id}`, {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  deleteCollection(accessToken: string, id: string): Promise<void> {
    return this.request<void>(`/admin/collections/${id}`, { method: 'DELETE', accessToken });
  }

  updateCollectionRules(
    accessToken: string,
    id: string,
    matchType: CollectionRuleMatchType,
    rules: CollectionRuleValue[],
  ): Promise<void> {
    return this.request<void>(`/admin/collections/${id}/rules`, {
      method: 'PUT',
      accessToken,
      body: JSON.stringify({ matchType, rules }),
    });
  }

  addProductsToCollection(accessToken: string, id: string, productIds: string[]): Promise<void> {
    return this.request<void>(`/admin/collections/${id}/products`, {
      method: 'POST',
      accessToken,
      body: JSON.stringify({ productIds }),
    });
  }

  removeProductFromCollection(accessToken: string, id: string, productId: string): Promise<void> {
    return this.request<void>(`/admin/collections/${id}/products/${productId}`, {
      method: 'DELETE',
      accessToken,
    });
  }

  reorderCollectionProducts(
    accessToken: string,
    id: string,
    orderedProductIds: string[],
  ): Promise<void> {
    return this.request<void>(`/admin/collections/${id}/products/reorder`, {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify({ orderedProductIds }),
    });
  }

  listPublicCollections(
    params: ProductPageParams & { search?: string } = {},
  ): Promise<{ items: Collection[]; total: number }> {
    const query = toQueryString({
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
    });
    return this.request<{ items: Collection[]; total: number }>(`/collections${query}`);
  }

  getPublicCollection(
    slug: string,
    params: ProductPageParams = {},
  ): Promise<CollectionWithProducts> {
    const query = toQueryString({ page: params.page, pageSize: params.pageSize });
    return this.request<CollectionWithProducts>(`/collections/${slug}${query}`);
  }

  getProductOptions(accessToken: string, productId: string): Promise<ProductOption[]> {
    return this.request<ProductOption[]>(`/admin/products/${productId}/options`, { accessToken });
  }

  createProductOption(
    accessToken: string,
    productId: string,
    input: CreateProductOptionInput,
  ): Promise<ProductOption> {
    return this.request<ProductOption>(`/admin/products/${productId}/options`, {
      method: 'POST',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  updateProductOption(
    accessToken: string,
    id: string,
    input: UpdateProductOptionInput,
  ): Promise<ProductOption> {
    return this.request<ProductOption>(`/admin/options/${id}`, {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  deleteProductOption(accessToken: string, id: string): Promise<void> {
    return this.request<void>(`/admin/options/${id}`, { method: 'DELETE', accessToken });
  }

  listProductVariants(
    accessToken: string,
    productId: string,
    params: ListVariantsParams = {},
  ): Promise<PaginatedResult<ProductVariant>> {
    const query = toQueryString({
      page: params.page,
      pageSize: params.pageSize,
      status: params.status,
    });
    return this.request<PaginatedResult<ProductVariant>>(
      `/admin/products/${productId}/variants${query}`,
      { accessToken },
    );
  }

  getProductVariant(accessToken: string, id: string): Promise<ProductVariant> {
    return this.request<ProductVariant>(`/admin/variants/${id}`, { accessToken });
  }

  createProductVariant(
    accessToken: string,
    productId: string,
    input: CreateProductVariantInput,
  ): Promise<ProductVariant> {
    return this.request<ProductVariant>(`/admin/products/${productId}/variants`, {
      method: 'POST',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  updateProductVariant(
    accessToken: string,
    id: string,
    input: UpdateProductVariantInput,
  ): Promise<ProductVariant> {
    return this.request<ProductVariant>(`/admin/variants/${id}`, {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  deleteProductVariant(accessToken: string, id: string): Promise<void> {
    return this.request<void>(`/admin/variants/${id}`, { method: 'DELETE', accessToken });
  }

  generateVariants(
    accessToken: string,
    productId: string,
    input: GenerateVariantsInput = {},
  ): Promise<GenerateVariantsResult> {
    return this.request<GenerateVariantsResult>(`/admin/products/${productId}/variants/generate`, {
      method: 'POST',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  bulkUpdateVariants(accessToken: string, input: BulkUpdateVariantsInput): Promise<void> {
    return this.request<void>('/admin/variants/bulk', {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  getPublicProductVariants(
    slug: string,
    params: ProductPageParams = {},
  ): Promise<PaginatedResult<ProductVariant>> {
    const query = toQueryString({ page: params.page, pageSize: params.pageSize });
    return this.request<PaginatedResult<ProductVariant>>(`/products/${slug}/variants${query}`);
  }

  listAttributes(
    accessToken: string,
    params: ListAttributesParams = {},
  ): Promise<PaginatedResult<Attribute>> {
    const query = toQueryString({
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      status: params.status,
      type: params.type,
      isFilterable: params.isFilterable !== undefined ? String(params.isFilterable) : undefined,
    });
    return this.request<PaginatedResult<Attribute>>(`/admin/attributes${query}`, { accessToken });
  }

  getAttribute(accessToken: string, id: string): Promise<Attribute> {
    return this.request<Attribute>(`/admin/attributes/${id}`, { accessToken });
  }

  createAttribute(accessToken: string, input: CreateAttributeInput): Promise<Attribute> {
    return this.request<Attribute>('/admin/attributes', {
      method: 'POST',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  updateAttribute(
    accessToken: string,
    id: string,
    input: UpdateAttributeInput,
  ): Promise<Attribute> {
    return this.request<Attribute>(`/admin/attributes/${id}`, {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  deleteAttribute(accessToken: string, id: string): Promise<void> {
    return this.request<void>(`/admin/attributes/${id}`, { method: 'DELETE', accessToken });
  }

  getProductAttributes(accessToken: string, productId: string): Promise<ProductAttributeView[]> {
    return this.request<ProductAttributeView[]>(`/admin/products/${productId}/attributes`, {
      accessToken,
    });
  }

  assignProductAttribute(
    accessToken: string,
    productId: string,
    input: AssignAttributeInput,
  ): Promise<ProductAttributeAssignment> {
    return this.request<ProductAttributeAssignment>(`/admin/products/${productId}/attributes`, {
      method: 'POST',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  bulkAssignProductAttributes(
    accessToken: string,
    productId: string,
    input: BulkAssignAttributesInput,
  ): Promise<void> {
    return this.request<void>(`/admin/products/${productId}/attributes/bulk`, {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  removeProductAttribute(
    accessToken: string,
    productId: string,
    attributeId: string,
  ): Promise<void> {
    return this.request<void>(`/admin/products/${productId}/attributes/${attributeId}`, {
      method: 'DELETE',
      accessToken,
    });
  }

  getFilters(filters: AttributeFilterInput[] = []): Promise<FacetResult[]> {
    const query = toQueryString({
      filters: filters.length > 0 ? JSON.stringify(filters) : undefined,
    });
    return this.request<FacetResult[]>(`/filters${query}`);
  }

  searchProducts(
    params: SearchProductsParams = {},
  ): Promise<PaginatedResult<ProductSearchSummary>> {
    const query = toQueryString({
      page: params.page,
      pageSize: params.pageSize,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
      filters: params.filters?.length ? JSON.stringify(params.filters) : undefined,
    });
    return this.request<PaginatedResult<ProductSearchSummary>>(`/products/search${query}`);
  }

  listWarehouses(
    accessToken: string,
    params: ListWarehousesParams = {},
  ): Promise<PaginatedResult<Warehouse>> {
    const query = toQueryString({
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      status: params.status,
    });
    return this.request<PaginatedResult<Warehouse>>(`/admin/warehouses${query}`, { accessToken });
  }

  getWarehouse(accessToken: string, id: string): Promise<Warehouse> {
    return this.request<Warehouse>(`/admin/warehouses/${id}`, { accessToken });
  }

  createWarehouse(accessToken: string, input: CreateWarehouseInput): Promise<Warehouse> {
    return this.request<Warehouse>('/admin/warehouses', {
      method: 'POST',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  updateWarehouse(
    accessToken: string,
    id: string,
    input: UpdateWarehouseInput,
  ): Promise<Warehouse> {
    return this.request<Warehouse>(`/admin/warehouses/${id}`, {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  listInventory(
    accessToken: string,
    params: ListInventoryParams = {},
  ): Promise<PaginatedResult<InventoryListItem>> {
    const query = toQueryString({
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      warehouseId: params.warehouseId,
      belowSafetyStock:
        params.belowSafetyStock !== undefined ? String(params.belowSafetyStock) : undefined,
    });
    return this.request<PaginatedResult<InventoryListItem>>(`/admin/inventory${query}`, {
      accessToken,
    });
  }

  getInventoryItem(accessToken: string, variantId: string): Promise<InventoryItem[]> {
    return this.request<InventoryItem[]>(`/admin/inventory/${variantId}`, { accessToken });
  }

  adjustInventory(accessToken: string, input: AdjustInventoryInput): Promise<InventoryItem> {
    return this.request<InventoryItem>('/admin/inventory/adjust', {
      method: 'POST',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  reserveStock(accessToken: string, input: ReservationReferenceInput): Promise<InventoryItem> {
    return this.request<InventoryItem>('/admin/inventory/reserve', {
      method: 'POST',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  releaseStock(accessToken: string, input: ReservationReferenceInput): Promise<InventoryItem> {
    return this.request<InventoryItem>('/admin/inventory/release', {
      method: 'POST',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  confirmReservation(
    accessToken: string,
    input: ReservationReferenceInput,
  ): Promise<InventoryItem> {
    return this.request<InventoryItem>('/admin/inventory/confirm', {
      method: 'POST',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  setSafetyStock(accessToken: string, input: SetSafetyStockInput): Promise<InventoryItem> {
    return this.request<InventoryItem>('/admin/inventory/safety-stock', {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  listInventoryMovements(
    accessToken: string,
    params: ListMovementsParams = {},
  ): Promise<PaginatedResult<InventoryMovement>> {
    const query = toQueryString({
      page: params.page,
      pageSize: params.pageSize,
      variantId: params.variantId,
      warehouseId: params.warehouseId,
      type: params.type,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
    });
    return this.request<PaginatedResult<InventoryMovement>>(`/admin/inventory/movements${query}`, {
      accessToken,
    });
  }
}
