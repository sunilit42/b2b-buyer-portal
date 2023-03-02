import {
  CardContent,
  Card,
  Typography,
  Box,
  Button,
} from '@mui/material'

interface DashboardCardProps {
  row: CustomFieldStringItems,
  startActing: (id: number) => void,
  endActing: () => void,
  salesRepCompanyId?: number,
}

const DashboardCard = ({
  row,
  startActing,
  endActing,
  salesRepCompanyId = 0,
}: DashboardCardProps) => {
  console.log(row)
  return (
    <Card>

      <CardContent
        sx={{
          color: '#313440',
        }}
      >

        <Typography
          sx={{
            fontWeight: 400,
            fontSize: '24px',
            color: 'rgba(0, 0, 0, 0.87)',
          }}
        >
          {row.companyName}
        </Typography>

        {
        row.companyId === +salesRepCompanyId && (
        <Box
          sx={{
            fontWeight: 400,
            fontSize: '13px',
            background: '#ED6C02',
            display: 'inline-block',
            p: '2px 7px',
            color: '#FFFFFF',
            borderRadius: '10px',
          }}
        >
          Selected
        </Box>
        )
      }

        <Box
          sx={{
            display: 'flex',
            fontSize: '16px',
            mt: '15px',
          }}
        >
          <Typography
            sx={{
              fontWeight: 500,
            }}
          >
            Admin:
          </Typography>
          <Typography variant="body1">
            {row.companyAdminName}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            fontSize: '16px',
            mt: '15px',
          }}
        >
          <Typography
            sx={{
              fontWeight: 500,
            }}
          >
            Email:
          </Typography>
          <Typography variant="body1">
            {row.companyEmail}
          </Typography>
        </Box>
      </CardContent>

      {
        row.companyId === +salesRepCompanyId ? (
          <Button
            sx={{
              ml: '10px',
              mb: '10px',
            }}
            variant="text"
            onClick={() => endActing()}
          >
            End MASQUERADE
          </Button>
        ) : (
          <Button
            sx={{
              ml: '10px',
              mb: '10px',
            }}
            variant="text"
            onClick={() => startActing(row.companyId)}
          >
            MASQUERADE
          </Button>
        )
      }

    </Card>
  )
}

export default DashboardCard