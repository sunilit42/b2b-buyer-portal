import { useContext, useEffect, useRef } from 'react'

import { B3Tip } from '@/components'
import { useMobile } from '@/hooks'
import { DynamicallyVariableedContext } from '@/shared/dynamicallyVariable'
import { MsgsProps } from '@/shared/dynamicallyVariable/context/config'

function B3LayoutTip() {
  const {
    state: { tipMessage },
    dispatch,
  } = useContext(DynamicallyVariableedContext)

  const [isMobile] = useMobile()

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    window.tipDispatch = dispatch
  }, [])

  // useEffect(() => {
  //   window.b3Tipmessage = tipMessage?.msgs || []
  // }, [tipMessage])

  const setMsgs = (msgs: [] | Array<MsgsProps> = []) => {
    dispatch({
      type: 'common',
      payload: {
        tipMessage: {
          ...tipMessage,
          msgs,
        },
      },
    })
  }

  const handleClose = (id: number | string) => {
    const msgs = tipMessage?.msgs || []
    const newMsgs = msgs.filter((msg) => msg.id !== id)
    setMsgs(newMsgs)
  }

  const {
    msgs = [],
    autoHideDuration = 3000,
    vertical = `${isMobile ? 'top' : 'top'}`,
    horizontal = 'right',
  } = tipMessage

  const closeMsgs = () => {
    const { msgs = [] } = tipMessage

    if (timer.current) {
      clearTimeout(timer.current)
    }

    if (msgs.length) {
      timer.current = setTimeout(() => {
        const newMsgs = msgs.filter((item: MsgsProps) => item.isClose)
        dispatch({
          type: 'common',
          payload: {
            tipMessage: {
              ...tipMessage,
              msgs: newMsgs,
            },
          },
        })
      }, autoHideDuration)
    }
  }

  return (
    <B3Tip
      msgs={msgs}
      handleAllClose={closeMsgs}
      autoHideDuration={autoHideDuration}
      handleItemClose={handleClose}
      // handleItemClose={isClose ? handleClose : undefined}
      vertical={vertical}
      horizontal={horizontal}
    />
  )
}

export default B3LayoutTip
