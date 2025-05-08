import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { collection, query, getDocs, where, deleteDoc, doc } from 'firebase/firestore';
import { saveAs } from 'file-saver';
import { Refresh as RefreshIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Invoice } from '../types/invoice';
import {
  Container,
  Paper,
  TextField,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormGroup,
  FormControlLabel,
  IconButton,
  Checkbox,
  Button,
  Typography,
  CircularProgress,
  Stack
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Download as DownloadIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const Logo = styled('img')({
  height: '40px',
  marginRight: '1rem',
});

interface ExportField {
  key: keyof Invoice;
  label: string;
  checked: boolean;
}

export default function Dashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerms, setSearchTerms] = useState({
    empresa: '',
    importe: '',
    fecha: ''
  });
  const [openExportDialog, setOpenExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('csv');
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    open: boolean;
    invoiceId: string | null;
  }>({
    open: false,
    invoiceId: null
  });
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [exportFields, setExportFields] = useState<ExportField[]>(() => {
    const savedFields = localStorage.getItem('exportFields');
    if (savedFields) {
      return JSON.parse(savedFields);
    }
    return [
      { key: 'Fecha', label: 'Fecha', checked: true },
      { key: 'Número de Factura', label: 'Número de Factura', checked: false },
      { key: 'Nombre Empresa Emisora', label: 'Empresa Emisora', checked: true },
      { key: 'NIF Empresa Emisora', label: 'NIF Emisor', checked: false },
      { key: 'Dirección Empresa Emisora', label: 'Dirección Emisor', checked: false },
      { key: 'Nombre Empresa Receptora', label: 'Empresa Receptora', checked: false },
      { key: 'NIF Empresa Receptora', label: 'NIF Receptor', checked: false },
      { key: 'Dirección Empresa Receptora', label: 'Dirección Receptor', checked: false },
      { key: 'Total a Pagar', label: 'Total', checked: false },
      { key: 'Fecha de Vencimiento', label: 'Fecha de Vencimiento', checked: false },
      { key: 'Método de Pago', label: 'Método de Pago', checked: false },
      { key: 'Detalles de Pago', label: 'Detalles de Pago', checked: false },
      { key: 'Importe Total Antes de Impuestos', label: 'Base Imponible', checked: false },
      { key: 'Importe Total de Impuestos', label: 'Total Impuestos', checked: false },
    ];
  });
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();

  const fetchInvoices = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'invoices'),
        where('userId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const invoicesData = querySnapshot.docs.map(doc => {
        const rawData = doc.data();
        const data = rawData.data || rawData; 
        let createdAt = null;
        
        // Handle different date formats
        if (rawData.createdAt) {
          createdAt = rawData.createdAt.toDate();
        } else if (rawData.date) {
          createdAt = rawData.date.toDate();
        }

        return {
          id: doc.id,
          ...data,
          createdAt,
          Fecha: data.Fecha,
          'Número de Factura': data['Número de Factura'],
          'Nombre Empresa Emisora': data['Nombre Empresa Emisora'],
          'NIF Empresa Emisora': data['NIF Empresa Emisora'],
          'Dirección Empresa Emisora': data['Dirección Empresa Emisora'],
          'Nombre Empresa Receptora': data['Nombre Empresa Receptora'],
          'NIF Empresa Receptora': data['NIF Empresa Receptora'],
          'Dirección Empresa Receptora': data['Dirección Empresa Receptora'],
          'Total a Pagar': data['Total a Pagar'],
          'Importe Total Antes de Impuestos': data['Importe Total Antes de Impuestos'],
          'Importe Total de Impuestos': data['Importe Total de Impuestos']
        } as Invoice;
      });
      
      setInvoices(invoicesData);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [currentUser]);

  const handleDeleteInvoice = async () => {
    if (!deleteConfirmDialog.invoiceId) return;
    
    try {
      await deleteDoc(doc(db, 'invoices', deleteConfirmDialog.invoiceId));
      await fetchInvoices();
      setDeleteConfirmDialog({ open: false, invoiceId: null });
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'Fecha',
      headerName: 'Fecha',
      flex: 1,
      sortable: true
    },
    {
      field: 'Nombre Empresa Emisora',
      headerName: 'Empresa Emisora',
      flex: 2,
      sortable: true
    },
    {
      field: 'Nombre Empresa Receptora',
      headerName: 'Empresa Receptora',
      flex: 2,
      sortable: true
    },
    {
      field: 'createdAt',
      headerName: 'Fecha de Creación',
      flex: 1,
      sortable: true,
      valueFormatter: (params) => {
        if (!params.value) return 'No disponible';
        try {
          return new Date(params.value).toLocaleString('es-ES');
        } catch (e) {
          return 'No disponible';
        }
      }
    },
    {
      field: 'Total a Pagar',
      headerName: 'Total a Pagar',
      flex: 1,
      sortable: true
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            setDeleteConfirmDialog({
              open: true,
              invoiceId: params.row.id
            });
          }}
          color="error"
        >
          <DeleteIcon />
        </IconButton>
      )
    }
  ];

  const filteredInvoices = invoices.filter(invoice => {
    const matchEmpresa = invoice['Nombre Empresa Emisora']?.toLowerCase().includes(searchTerms.empresa.toLowerCase()) ?? false;
    const matchImporte = searchTerms.importe ? invoice['Total a Pagar']?.includes(searchTerms.importe) : true;
    const matchFecha = searchTerms.fecha ? invoice['Fecha']?.includes(searchTerms.fecha) : true;
    return matchEmpresa && matchImporte && matchFecha;
  });

  const handleRowClick = (params: any) => {
    navigate(`/invoice/${params.id}`);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleExportFieldChange = (index: number) => {
    const newFields = [...exportFields];
    newFields[index].checked = !newFields[index].checked;
    setExportFields(newFields);
    localStorage.setItem('exportFields', JSON.stringify(newFields));
  };

  const handleExport = async () => {
    const selectedFields = exportFields.filter(field => field.checked);
    
    let filteredInvoices = [...invoices];
    if (startDate) {
      filteredInvoices = filteredInvoices.filter(invoice => 
        dayjs(invoice.Fecha, 'DD.MM.YYYY').isAfter(startDate, 'day') || 
        dayjs(invoice.Fecha, 'DD.MM.YYYY').isSame(startDate, 'day')
      );
    }
    if (endDate) {
      filteredInvoices = filteredInvoices.filter(invoice => 
        dayjs(invoice.Fecha, 'DD.MM.YYYY').isBefore(endDate, 'day') || 
        dayjs(invoice.Fecha, 'DD.MM.YYYY').isSame(endDate, 'day')
      );
    }

    const data = filteredInvoices.map(invoice =>
      selectedFields.reduce((acc, field) => {
        let value = invoice[field.key];
        if (field.key === 'Items' && Array.isArray(invoice.Items)) {
          value = invoice.Items.map(item => item.Producto).join(', ');
        }
        acc[field.label] = value ?? '';
        return acc;
      }, {} as Record<string, any>)
    );

    if (exportFormat === 'xlsx') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Facturas");
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `facturas_${dayjs().format('YYYY-MM-DD')}.xlsx`);
    } else {
      const csvContent = [
        selectedFields.map(field => field.label).join(','),
        ...data.map(row => 
          selectedFields
            .map(field => `"${row[field.label] || ''}"`)
            .join(',')
        )
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, `facturas_${dayjs().format('YYYY-MM-DD')}.csv`);
    }

    setOpenExportDialog(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth={false} sx={{ height: '100vh', p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Logo
            src="/logo.png"
            alt="Factumattic Logo"
          />
          <Typography variant="h4" component="h1">
            Facturas
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => setOpenExportDialog(true)}
            sx={{ mr: 2 }}
          >
            Exportar
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => fetchInvoices()}
            sx={{ mr: 2 }}
          >
            Actualizar
          </Button>
          <Button variant="contained" color="primary" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        </Box>
      </Box>
      
      <Dialog open={openExportDialog} onClose={() => setOpenExportDialog(false)}>
        <DialogTitle>Exportar Facturas</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2, minWidth: 300 }}>
            <Box>
              <Typography variant="subtitle1" gutterBottom>Formato de exportación</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant={exportFormat === 'csv' ? 'contained' : 'outlined'}
                  onClick={() => setExportFormat('csv')}
                >
                  CSV
                </Button>
                <Button
                  variant={exportFormat === 'xlsx' ? 'contained' : 'outlined'}
                  onClick={() => setExportFormat('xlsx')}
                >
                  Excel
                </Button>
              </Box>
            </Box>
            <Typography variant="subtitle1">Rango de fechas</Typography>
            <DatePicker
              label="Fecha inicio"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
            />
            <DatePicker
              label="Fecha fin"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
            />
            <Typography variant="subtitle1">Campos a exportar</Typography>
            <FormGroup>
              {exportFields.map((field, index) => (
                <FormControlLabel
                  key={field.key}
                  control={
                    <Checkbox
                      checked={field.checked}
                      onChange={() => handleExportFieldChange(index)}
                    />
                  }
                  label={field.label}
                />
              ))}
            </FormGroup>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExportDialog(false)}>Cancelar</Button>
          <Button onClick={handleExport} variant="contained" color="primary">
            Descargar {exportFormat === 'csv' ? 'CSV' : 'Excel'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Paper sx={{ p: 2, mb: 3, height: 'calc(100vh - 180px)' }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Buscar por empresa emisora"
            variant="outlined"
            value={searchTerms.empresa}
            onChange={(e) => setSearchTerms(prev => ({ ...prev, empresa: e.target.value }))}
            sx={{ flex: 1 }}
          />
          <TextField
            label="Buscar por importe"
            variant="outlined"
            value={searchTerms.importe}
            onChange={(e) => setSearchTerms(prev => ({ ...prev, importe: e.target.value }))}
            sx={{ flex: 1 }}
          />
          <TextField
            label="Buscar por fecha"
            variant="outlined"
            value={searchTerms.fecha}
            onChange={(e) => setSearchTerms(prev => ({ ...prev, fecha: e.target.value }))}
            sx={{ flex: 1 }}
          />
        </Box>
        
        <div style={{ height: 'calc(100% - 80px)', width: '100%' }}>
          <DataGrid
            rows={filteredInvoices}
            columns={columns}
            initialState={{
              sorting: {
                sortModel: [{ field: 'createdAt', sort: 'desc' }],
              },
            }}
            pageSizeOptions={[5, 10, 25]}
            onRowClick={handleRowClick}
          />
        </div>
      </Paper>
      
      <Dialog
        open={deleteConfirmDialog.open}
        onClose={() => setDeleteConfirmDialog({ open: false, invoiceId: null })}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar esta factura? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmDialog({ open: false, invoiceId: null })}>
            Cancelar
          </Button>
          <Button onClick={handleDeleteInvoice} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}