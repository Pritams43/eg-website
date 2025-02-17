import React from 'react'
import { Box } from 'native-base'
import PropTypes from 'prop-types'

const BoxBlue = ({ children, width,height, ...props }) => {
  const styles = {
    box: {
      background:
        'linear-gradient(269deg, rgba(176, 70, 70, 0.03) -31.46%, rgb(72 67 67 / 0%) -31.44%, rgba(194, 41, 41, 0.42) -10.63%, #ffffff 35.75%, rgb(255, 255, 255) 70.75%, rgba(199, 26, 26, 0.23) 108.28%, rgba(255, 255, 255, 0) 127.93%)'
    }
  }
  return (
    <Box
      {...props}
      width={width || '200px'}
      height={height || '143px'}
      shadow='RedBlackShadow'
      // borderWidth='2px
      rounded='10px'
      style={styles.box}
    >
      {children}
    </Box>
  )
}
export default React.memo(BoxBlue)

BoxBlue.propTypes = {
  children: PropTypes.any,
  width: PropTypes.any,
  height: PropTypes.any
}
