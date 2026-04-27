import api from "./axios";
import type { ApiResponse } from "../types/common";
import type { LoginResponseApi } from "../types/auth";
import type { DashboardResumen, Cliente, Servicio, ClienteServicio, PlantillaContrato, Contrato, AgendaEvento, Pago, User } from "../types/entities";

export const authApi = { login: async (payload:{username:string;password:string}) => (await api.post<LoginResponseApi>("/auth/login", payload)).data };
export const dashboardApi = { resumen: async () => (await api.get<ApiResponse<DashboardResumen>>("/dashboard/resumen")).data };

export const clientesApi = { list: async () => 
     (await api.get<ApiResponse<Cliente[]>>("/clientes")).data, 
      create: async (p:any) => (await api.post("/clientes", p)).data,
      update: async (id:number,p:any)=>
         (await api.put(`/clientes/${id}`, p)).data };


export const serviciosApi = { list: async () => (await api.get<ApiResponse<Servicio[]>>("/servicios")).data, create: async (p:any)=> (await api.post("/servicios", p)).data };
export const clienteServiciosApi = { list: async () => (await api.get<ApiResponse<ClienteServicio[]>>("/cliente-servicios")).data, create: async (p:any)=> (await api.post("/cliente-servicios", p)).data };
export const plantillasApi = { list: async () => (await api.get<ApiResponse<PlantillaContrato[]>>("/plantillas-contrato")).data, upload: async (fd:FormData) => (await api.post("/plantillas-contrato/upload", fd, {headers:{"Content-Type":"multipart/form-data"}})).data };

export const contratosApi = { list: async () => 
   (await api.get<ApiResponse<Contrato[]>>("/contratos")).data, 
   create: async (p:any)=> (await api.post("/contratos", p)).data, 
   downloadWord: async (id:number)=> await api.get(`/contratos/descargar-word/${id}`, { responseType:"blob" }), 
   };
   
export const agendaApi = { list: async () => (await api.get<ApiResponse<AgendaEvento[]>>("/agenda")).data, create: async (p:any)=> (await api.post("/agenda", p)).data };
export const pagosApi = { list: async () => (await api.get<ApiResponse<Pago[]>>("/pagos")).data, create: async (p:any)=> (await api.post("/pagos", p)).data };
export const usersApi = { list: async () => (await api.get<ApiResponse<User[]>>("/users")).data, create: async (p:any)=> (await api.post("/users", p)).data };
