import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Invoice } from '../types/invoice';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Divider,
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { ArrowBack, Close as CloseIcon } from '@mui/icons-material';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleDownload = () => {
    if (invoice?.file_id) {
      window.open(`https://factumattic.s3.eu-north-1.amazonaws.com/${invoice.file_id}`, '_blank');
    }
  };

  useEffect(() => {
    async function fetchInvoice() {
      if (!id) return;

      try {
        const docRef = doc(db, 'invoices', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const rawData = docSnap.data();
          const data = rawData.data || rawData;
          
          const transformedData = {
            id: docSnap.id,
            Fecha: data.date?.toDate().toLocaleDateString('es-ES') || data.Fecha,
            'Número de Factura': data.invoiceNumber || data['Número de Factura'],
            'Nombre Empresa Emisora': data.companyName || data['Nombre Empresa Emisora'],
            'Total a Pagar': data.amount || data['Total a Pagar'],
            ...data
          } as Invoice;
          
          setInvoice(transformedData);
          console.log('Transformed invoice data:', transformedData);
        } else {
          setError('Factura no encontrada');
        }
      } catch (err) {
        setError('Error al cargar la factura');
        console.error('Error fetching invoice:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchInvoice();
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !invoice) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Typography color="error">{error || 'No se encontró la factura'}</Typography>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')} sx={{ mt: 2 }}>
            Volver al Dashboard
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')}>
            Volver
          </Button>
          <Button variant="contained" color="primary" onClick={handleOpenModal}>
            Ver Documento
          </Button>
        </Box>

        <Dialog
          open={openModal}
          onClose={handleCloseModal}
          maxWidth="lg"
          fullWidth
        >
          <DialogContent sx={{ position: 'relative', height: '80vh', p: 0 }}>
            <IconButton
              onClick={handleCloseModal}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: 'grey.500',
                bgcolor: 'background.paper',
                '&:hover': {
                  bgcolor: 'grey.100',
                },
                zIndex: 1,
              }}
            >
              <CloseIcon />
            </IconButton>
            <iframe
              src={`https://factumattic.s3.eu-north-1.amazonaws.com/${invoice.file_id}`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              title="Documento de factura"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal}>Cerrar</Button>
            <Button onClick={handleDownload} variant="contained" color="primary">
              Descargar
            </Button>
          </DialogActions>
        </Dialog>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>Información General</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Número de Factura</Typography>
              <Typography variant="body1" gutterBottom>{invoice['Número de Factura']}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Fecha</Typography>
              <Typography variant="body1" gutterBottom>{invoice.Fecha}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Fecha de Vencimiento</Typography>
              <Typography variant="body1" gutterBottom>{invoice['Fecha de Vencimiento']}</Typography>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>Datos de Emisor y Receptor</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Emisor</Typography>
              <Typography variant="subtitle2">Empresa</Typography>
              <Typography variant="body1">{invoice['Nombre Empresa Emisora']}</Typography>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>NIF</Typography>
              <Typography variant="body1">{invoice['NIF Empresa Emisora']}</Typography>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>Dirección</Typography>
              <Typography variant="body1">{invoice['Dirección Empresa Emisora']}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Receptor</Typography>
              <Typography variant="subtitle2">Empresa/Nombre</Typography>
              <Typography variant="body1">{invoice['Nombre Empresa Receptora']}</Typography>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>NIF</Typography>
              <Typography variant="body1">{invoice['NIF Empresa Receptora']}</Typography>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>Dirección</Typography>
              <Typography variant="body1">{invoice['Dirección Empresa Receptora']}</Typography>
            </Grid>
          </Grid>
        </Paper>

        {invoice.Items && invoice.Items.length > 0 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>Lista de Items</Typography>
            <TableContainer>
              <Table>
                <TableBody>
                  {invoice.Items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.Producto}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {invoice.IVA && invoice.IVA.length > 0 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>Información de IVA</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Base Imponible</TableCell>
                    <TableCell align="right">Tipo de IVA</TableCell>
                    <TableCell align="right">Importe de IVA</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.IVA.map((iva, index) => (
                    <TableRow key={index}>
                      <TableCell>{iva['Base imponible']}</TableCell>
                      <TableCell align="right">{iva['Tipo de IVA']}%</TableCell>
                      <TableCell align="right">{iva['Importe de IVA']}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>Datos de Pago</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Método de Pago</Typography>
              <Typography variant="body1" gutterBottom>{invoice['Método de Pago']}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Detalles de Pago</Typography>
              <Typography variant="body1" gutterBottom>{invoice['Detalles de Pago']}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Typography variant="subtitle1">Total a Pagar</Typography>
                <Typography variant="h6">{invoice['Total a Pagar']} €</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default InvoiceDetail;