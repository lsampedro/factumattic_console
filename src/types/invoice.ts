export interface InvoiceItem {
  Producto: string;
  Cantidad: string;
  "Precio Unitario": string;
  "Impuesto Aplicado": string;
  Subtotal: string;
  "Precio Total": string;
}

export interface IVADetail {
  "Base imponible": string;
  "Tipo de IVA": string;
  "Importe de IVA": string;
}

export interface Invoice {
  Fecha: string;
  "Número de Factura": string;
  "Nombre Empresa Emisora": string;
  "NIF Empresa Emisora": string;
  "Dirección Empresa Emisora": string;
  "Nombre Empresa Receptora": string;
  "NIF Empresa Receptora": string;
  "Dirección Empresa Receptora": string;
  Items: InvoiceItem[];
  IVA: IVADetail[];
  "Cuota Retención": string;
  "Tipo de Retención": string;
  "Importe Total Antes de Impuestos": string;
  "Importe Total de Impuestos": string;
  "Total a Pagar": string;
  "Fecha de Vencimiento": string;
  "Método de Pago": string;
  "Detalles de Pago": string;
  file_id: string;
  userId?: string;
}