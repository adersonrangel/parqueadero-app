export interface Usuario {
  id: number;
  placa: string;
  nombre: string;
  fecha_registro: string;
}

export interface Mensualidad {
  id: number;
  placa: string;
  nombre: string;
  valor_pagado: number;
  fecha_pago: string;
  mes: string;
  anio: number;
}

export interface PagosMesActual {
  cantidad: number;
  total: number;
}

export interface RecaudacionPorMes {
  mes: string;
  anio: number;
  total: number;
}

export interface PagosPorUsuario {
  placa: string;
  nombre: string;
  total_pagos: number;
  total_pagado: number;
}

export interface DashboardData {
  total_usuarios: number;
  total_mensualidades: number;
  total_recaudado: number;
  promedio_mensual: number;
  pagos_mes_actual: PagosMesActual;
  recaudado_por_mes: RecaudacionPorMes[];
  pagos_por_usuario: PagosPorUsuario[];
}

export interface ApiResponse<T = unknown> {
  message?: string;
  error?: string;
  data?: T;
}
