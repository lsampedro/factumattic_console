import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { saveAs } from 'file-saver';
import { Refresh as RefreshIcon } from '@mui/icons-material';
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

interface ExportField {
  key: keyof Invoice;
  label: string;
  checked: boolean;
}

export default function Dashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openExportDialog, setOpenExportDialog] = useState(false);
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
        return {
          id: doc.id,
          ...data,
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

  const columns: GridColDef[] = [
    {
      field: 'Fecha',
      headerName: 'Fecha',
      width: 130,
      sortable: true
    },
    {
      field: 'Nombre Empresa Emisora',
      headerName: 'Empresa Emisora',
      width: 300,
      sortable: true
    },
    {
      field: 'Total a Pagar',
      headerName: 'Total a Pagar',
      width: 130,
      sortable: true
    }
  ];

  const filteredInvoices = invoices.filter(invoice =>
    invoice['Nombre Empresa Emisora']?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false
  );

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

  const handleExport = () => {
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

    const csvContent = [
      selectedFields.map(field => field.label).join(','),
      ...filteredInvoices.map(invoice =>
        selectedFields
          .map(field => {
            const value = invoice[field.key];
            if (value === undefined || value === null) {
              return '""';
            }
            if (field.key === 'Items' && Array.isArray(invoice.Items)) {
              return `"${invoice.Items.map(item => item.Producto).join(', ')}"`;
            }
            return typeof value === 'string' ? `"${value}"` : `"${value}"`;
          })
          .join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `facturas_${dayjs().format('YYYY-MM-DD')}.csv`);
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Facturas
        </Typography>
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
            Descargar CSV
          </Button>
        </DialogActions>
      </Dialog>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          label="Buscar por empresa emisora"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
        />
        
        <div style={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={filteredInvoices}
            columns={columns}
            initialState={{
              sorting: {
                sortModel: [{ field: 'Fecha', sort: 'desc' }],
              },
            }}
            pageSizeOptions={[5, 10, 25]}
            onRowClick={handleRowClick}
          />
        </div>
      </Paper>
    </Container>
  );
}