import { delay } from '@/lib/utils';
// import { apiClient } from '@/lib/api-client';
import { fieldMockDb } from '@/lib/field-mock-db';
import type {
  ClientProfileDetail,
  CreateBranchPayload,
  CreateClientPayload,
  ExcelImportRow,
  ImportBatchResult,
} from '@/features/clients/types/client.types';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { Branch, Client } from '@/types/field.types';

export const clientsService = {
  async getClients(): Promise<PaginatedResponse<Client>> {
    await delay(400);

    // Llamada real lista para producción:
    // const { data } = await apiClient.get<PaginatedResponse<Client>>('/clients');
    // return data;

    const { clients } = fieldMockDb.getState();
    return {
      data: clients,
      meta: {
        total: clients.length,
        page: 1,
        pageSize: clients.length,
        totalPages: 1,
      },
    };
  },

  async getClientDetail(
    clientId: string
  ): Promise<ApiResponse<ClientProfileDetail>> {
    await delay(400);

    // Llamada real lista para producción:
    // const { data } = await apiClient.get<ApiResponse<ClientProfileDetail>>(`/clients/${clientId}`);
    // return data;

    const state = fieldMockDb.getState();
    const client = state.clients.find((c) => c.id === clientId);
    if (!client) {
      throw new Error('Cliente no encontrado en el padrón');
    }

    const servicePlans = state.servicePlans.filter(
      (p) => p.clientId === clientId
    );
    const visitsHistory = fieldMockDb
      .getEnrichedVisits()
      .filter((v) => v.clientId === clientId);

    return {
      data: {
        client,
        servicePlans,
        visitsHistory,
      },
      timestamp: new Date().toISOString(),
    };
  },

  async createClient(
    payload: CreateClientPayload
  ): Promise<ApiResponse<Client>> {
    await delay(400);

    // Llamada real lista para producción:
    // const { data } = await apiClient.post<ApiResponse<Client>>('/clients', payload);
    // return data;

    const clientId = `cli-${Date.now().toString().slice(-4)}`;
    const initialBranch: Branch = {
      id: `br-${Date.now().toString().slice(-4)}`,
      clientId,
      name: payload.branchName,
      address: payload.branchAddress,
      zone: payload.branchZone,
      contactName: payload.contactName,
      contactPhone: payload.contactPhone,
      contactEmail: payload.contactEmail,
    };

    const newClient: Client = {
      id: clientId,
      ruc: payload.ruc.trim(),
      businessName: payload.businessName.trim(),
      status: 'ACTIVO',
      branches: [initialBranch],
      createdAt: new Date().toISOString(),
    };

    fieldMockDb.updateState((prev) => ({
      ...prev,
      clients: [newClient, ...prev.clients],
    }));

    return {
      data: newClient,
      message: 'Cliente y sede principal registrados exitosamente',
      timestamp: new Date().toISOString(),
    };
  },

  async addBranch(
    clientId: string,
    payload: CreateBranchPayload
  ): Promise<ApiResponse<Branch>> {
    await delay(400);

    // Llamada real lista para producción:
    // const { data } = await apiClient.post<ApiResponse<Branch>>(`/clients/${clientId}/branches`, payload);
    // return data;

    const newBranch: Branch = {
      id: `br-${Date.now().toString().slice(-4)}`,
      clientId,
      name: payload.name.trim(),
      address: payload.address.trim(),
      zone: payload.zone.trim(),
      contactName: payload.contactName.trim(),
      contactPhone: payload.contactPhone.trim(),
      contactEmail: payload.contactEmail?.trim(),
    };

    fieldMockDb.updateState((prev) => ({
      ...prev,
      clients: prev.clients.map((client) =>
        client.id === clientId
          ? { ...client, branches: [...client.branches, newBranch] }
          : client
      ),
    }));

    return {
      data: newBranch,
      message: 'Sede agregada al cliente correctamente',
      timestamp: new Date().toISOString(),
    };
  },

  async importClientsBatch(
    rows: ExcelImportRow[]
  ): Promise<ApiResponse<ImportBatchResult>> {
    await delay(400);

    // Llamada real lista para producción:
    // const { data } = await apiClient.post<ApiResponse<ImportBatchResult>>('/clients/import-batch', { rows });
    // return data;

    let createdClientsCount = 0;
    let addedBranchesCount = 0;
    let updatedBranchesCount = 0;
    let skippedCount = 0;

    fieldMockDb.updateState((prev) => {
      const updatedClients = [...prev.clients];

      rows.forEach((row) => {
        if (row.resolution === 'SKIP') {
          skippedCount += 1;
          return;
        }

        const existingClientIdx = updatedClients.findIndex(
          (c) => c.ruc === row.ruc.trim()
        );

        if (existingClientIdx === -1) {
          const newClientId = `cli-imp-${row.rowNumber}-${Date.now().toString().slice(-3)}`;
          const newBranch: Branch = {
            id: `br-imp-${row.rowNumber}-${Date.now().toString().slice(-3)}`,
            clientId: newClientId,
            name: row.branchName,
            address: row.branchAddress,
            zone: row.branchZone,
            contactName: row.contactName,
            contactPhone: row.contactPhone,
          };
          updatedClients.unshift({
            id: newClientId,
            ruc: row.ruc.trim(),
            businessName: row.businessName.trim(),
            status: 'ACTIVO',
            branches: [newBranch],
            createdAt: new Date().toISOString(),
          });
          createdClientsCount += 1;
          addedBranchesCount += 1;
        } else {
          const existingClient = updatedClients[existingClientIdx];
          if (!existingClient) return;

          const normalizedAddress = row.branchAddress.trim().toLowerCase();
          const duplicateBranchIdx = existingClient.branches.findIndex(
            (b) => b.address.trim().toLowerCase() === normalizedAddress
          );

          if (duplicateBranchIdx === -1) {
            const newBranch: Branch = {
              id: `br-imp-${row.rowNumber}-${Date.now().toString().slice(-3)}`,
              clientId: existingClient.id,
              name: row.branchName,
              address: row.branchAddress,
              zone: row.branchZone,
              contactName: row.contactName,
              contactPhone: row.contactPhone,
            };
            updatedClients[existingClientIdx] = {
              ...existingClient,
              branches: [...existingClient.branches, newBranch],
            };
            addedBranchesCount += 1;
          } else if (row.resolution === 'UPDATE_MERGE') {
            const updatedBranches = existingClient.branches.map((b, idx) =>
              idx === duplicateBranchIdx
                ? {
                    ...b,
                    name: row.branchName,
                    zone: row.branchZone,
                    contactName: row.contactName,
                    contactPhone: row.contactPhone,
                  }
                : b
            );
            updatedClients[existingClientIdx] = {
              ...existingClient,
              businessName: row.businessName,
              branches: updatedBranches,
            };
            updatedBranchesCount += 1;
          } else {
            skippedCount += 1;
          }
        }
      });

      return {
        ...prev,
        clients: updatedClients,
      };
    });

    return {
      data: {
        createdClientsCount,
        addedBranchesCount,
        updatedBranchesCount,
        skippedCount,
      },
      message: 'Importación por lotes completada con control de duplicados',
      timestamp: new Date().toISOString(),
    };
  },
};
