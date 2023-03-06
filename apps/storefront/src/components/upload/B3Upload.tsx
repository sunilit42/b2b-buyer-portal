import {
  Box,
  Button,
  Link,
} from '@mui/material'

import Grid from '@mui/material/Unstable_Grid2'

import {
  useRef,
  useState,
  Dispatch,
  SetStateAction,
  useContext,
} from 'react'

import {
  DropzoneArea,
} from 'react-mui-dropzone'

import styled from '@emotion/styled'

import InsertDriveFile from '@mui/icons-material/InsertDriveFile'

import {
  snackbar,
  getDefaultCurrencyInfo,
} from '@/utils'

import {
  B2BProductsBulkUploadCSV,
  BcProductsBulkUploadCSV,
} from '@/shared/service/b2b'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  B3Sping,
} from '@/components'

import {
  useMobile,
} from '@/hooks'

import {
  B3Dialog,
} from '../B3Dialog'

import {
  B3UploadLoadding,
} from './B3UploadLoadding'
import BulkUploadTable from './BulkUploadTable'

import {
  removeEmptyRow,
  parseEmptyData,
} from './utils'

interface B3UploadProps {
  isOpen: boolean,
  setIsOpen: Dispatch<SetStateAction<boolean>>,
  bulkUploadTitle?: string,
  addBtnText?: string,
  handleAddToList: (validProduct: CustomFieldItems) => void,
  setProductData?: (product: CustomFieldItems) => void,
  isLoading?: boolean,
}

interface BulkUploadCSVProps {
  currencyCode: string,
  productList: CustomFieldItems,
  channelId?: number,
}

const FileUploadContainer = styled(Box)(() => ({
  width: '100%',
  border: '1px dashed #1976D2',
  borderRadius: '5px',
  position: 'relative',
  '& .file-upload-area': {
    height: '200px',
    '& .MuiSvgIcon-root': {
      display: 'none',
    },
  },
}))

export const B3Upload = (props: B3UploadProps) => {
  const {
    isOpen,
    setIsOpen,
    bulkUploadTitle = 'Bulk upload',
    addBtnText = 'add to list',
    handleAddToList = () => {},
    setProductData = () => {},
    isLoading = false,
  } = props

  const [isMobile] = useMobile()

  const {
    state: {
      isB2BUser,
      currentChannelId,
    },
  } = useContext(GlobaledContext)
  const uploadRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<string>('init')
  const [fileDatas, setFileDatas] = useState<CustomFieldItems>({})
  const [fileName, setFileName] = useState('')

  const {
    currency_code: currencyCode,
  } = getDefaultCurrencyInfo()

  const handleVerificationFile = (size: number, type: string) => {
    if (type !== 'text/csv') {
      snackbar.error('Table structure is wrong. Please download sample and follow it\'s structure.')
      return false
    }

    if (size > 1024 * 1024 * 50) {
      snackbar.error('Maximum file size 50MB')
      return false
    }

    return true
  }

  const handleBulkUploadCSV = async (parseData: CustomFieldItems) => {
    try {
      const params: BulkUploadCSVProps = {
        currencyCode,
        productList: parseData,
      }

      if (!isB2BUser) params.channelId = currentChannelId
      const BulkUploadCSV = isB2BUser ? B2BProductsBulkUploadCSV : BcProductsBulkUploadCSV

      const {
        productUpload,
      } = await BulkUploadCSV(params)

      if (productUpload) {
        const {
          result,
        } = productUpload
        const validProduct = result?.validProduct || []

        setProductData(validProduct)
        setFileDatas(result)
        setStep('end')
      }
    } catch (e) {
      setStep('init')
      console.error(e)
    }
  }

  const handleChange = async (files: File[]) => {
    // init loadding end
    const file = files.length > 0 ? files[0] : null

    if (file) {
      setFileName(file.name)
      const isPass = handleVerificationFile(file?.size, file?.type)

      if (!isPass) return
      const reader = new FileReader()

      reader.addEventListener('load', async (b: any) => {
        const csvdata = b.target.result

        if (csvdata) {
          setStep('loadding')
          const content = csvdata.split('\n')
          const EmptyData = removeEmptyRow(content)
          const parseData = parseEmptyData(EmptyData)

          // DOTO:
          await new Promise(() => {
            setTimeout(() => {
              handleBulkUploadCSV(parseData)
            }, 1000)
          })
        }
      })

      reader.readAsBinaryString(file)
    }
  }

  const openFile = () => {
    if (uploadRef.current) (uploadRef.current.children[1] as HTMLElement).click()
  }

  const getValidProducts = (products: CustomFieldItems) => {
    const notPurchaseSku: string[] = []
    const productItems: CustomFieldItems[] = []
    const limitProduct: CustomFieldItems[] = []
    const minLimitQuantity: CustomFieldItems[] = []
    const maxLimitQuantity: CustomFieldItems[] = []
    const outOfStock: CustomFieldItems[] = []

    products.forEach((item: CustomFieldItems) => {
      const {
        products: currentProduct,
        qty,
      } = item
      const {
        option,
        isStock,
        stock,
        purchasingDisabled,
        maxQuantity,
        minQuantity,
        variantSku,
        variantId,
        productId,
      } = currentProduct

      if (purchasingDisabled === '1') {
        notPurchaseSku.push(variantSku)
        return
      }

      if (isStock === '1' && stock === 0) {
        outOfStock.push(variantSku)
        return
      }

      if ((isStock === '1' && stock > 0) && stock < +qty) {
        limitProduct.push({
          variantSku,
          AvailableAmount: stock,
        })
        return
      }

      if (+minQuantity > 0 && +qty < +minQuantity) {
        minLimitQuantity.push({
          variantSku,
          minQuantity,
        })

        return
      }

      if (+maxQuantity > 0 && +qty > +maxQuantity) {
        maxLimitQuantity.push({
          variantSku,
          maxQuantity,
        })

        return
      }

      const optionsList = option.map((item: CustomFieldItems) => ({
        optionId: item.option_id,
        optionValue: item.id,
      }))

      productItems.push({
        productId: parseInt(productId, 10) || 0,
        variantId: parseInt(variantId, 10) || 0,
        quantity: +qty,
        optionList: optionsList,
      })
    })

    return {
      notPurchaseSku,
      productItems,
      limitProduct,
      minLimitQuantity,
      maxLimitQuantity,
      outOfStock,
    }
  }

  const handleConfirmToList = () => {
    const validProduct = fileDatas?.validProduct || []
    const stockErrorFile = fileDatas?.stockErrorFile || ''
    const stockErrorSkus = fileDatas?.stockErrorSkus || []
    if (validProduct?.length === 0) return

    if (validProduct) {
      const productsData: CustomFieldItems = getValidProducts(validProduct)

      if (stockErrorSkus.length > 0) {
        productsData.stockErrorFile = stockErrorFile
      }

      handleAddToList(productsData)
    }
  }

  const content = (
    <Box sx={{
      width: 'auto',
      position: 'absolute',
      transform: 'translate(-50%, -50%)',
      top: '50%',
      left: '50%',
    }}
    >
      <Grid
        container
        rowSpacing={1.5}
        display="flex"
        direction="column"
        justifyContent="center"
      >
        <Grid
          display="flex"
          justifyContent="center"
          xs={12}
        >
          <InsertDriveFile color="primary" />
        </Grid>

        <Grid
          display="flex"
          justifyContent="center"
          xs={12}
        >
          <Box sx={{
            fontSize: '16px',
            fontWeight: '400',
            color: '#5E637A',
          }}
          >
            Drag & drop file here
          </Box>
        </Grid>

        <Grid
          display="flex"
          xs={12}
          sx={{
            fontWeight: 400,
            fontSize: '14px',
            display: 'flex',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              color: '#8C93AD',
              whiteSpace: 'nowrap',
            }}
          >
            File types: CSV, maximum size: 50MB.
          </Box>
          <Box
            sx={{
              color: '#1976D2',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              marginLeft: '0.5rem',
            }}
          >
            <Link href="https://silk-demo-store45.mybigcommerce.com/content/sample_template.csv">
              Download sample
            </Link>
          </Box>
        </Grid>

        <Grid
          display="flex"
          justifyContent="center"
          xs={12}
        >
          <Button
            onClick={openFile}
            variant="outlined"
          >
            Upload file
          </Button>
        </Grid>

      </Grid>
    </Box>
  )

  return (
    <B3Dialog
      isOpen={isOpen}
      title={bulkUploadTitle}
      maxWidth="lg"
      leftSizeBtn={step === 'end' ? addBtnText : 'cancel'}
      handleLeftClick={step === 'end' ? () => {
        handleConfirmToList()
      } : () => {
        setIsOpen(false)
      }}
      showRightBtn={false}
      isShowBordered={false}
    >
      <Box
        sx={{
          maxHeight: isMobile ? '200px' : 'calc(100% - 64px)',
          minWidth: isMobile ? '100%' : '600px',
          margin: isMobile ? '' : '1rem',
        }}
      >

        {
          step === 'init' && (
          <FileUploadContainer ref={uploadRef}>
            {content}
            <DropzoneArea
              dropzoneClass="file-upload-area"
              filesLimit={1}
              onChange={handleChange}
              showPreviews={false}
              showPreviewsInDropzone={false}
              showAlerts={false}
              dropzoneText=""
            />
          </FileUploadContainer>
          )
        }

        {
          step === 'loadding' && <B3UploadLoadding step={step} />
        }
        <B3Sping
          isSpinning={isLoading}
          spinningHeight="auto"
        >
          {
            step === 'end' && (
            <BulkUploadTable
              setStep={setStep}
              fileDatas={fileDatas}
              fileName={fileName}
            />
            )
          }

        </B3Sping>
      </Box>
    </B3Dialog>
  )
}