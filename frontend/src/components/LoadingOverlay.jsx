import React from 'react';
import { CircularProgress, LinearProgress, Box, Typography } from '@mui/material';

export const LoadingOverlay = ({ progress, message = 'Processing...' }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        color: 'white',
      }}
    >
      <CircularProgress color="primary" size={60} thickness={4} />
      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
        {message}
      </Typography>
      {progress !== undefined && (
        <Box sx={{ width: '50%', maxWidth: 400, mt: 2 }}>
          <LinearProgress
            variant={progress >= 0 ? 'determinate' : 'indeterminate'}
            value={progress}
            sx={{
              height: 10,
              borderRadius: 5,
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
              },
            }}
          />
          {progress >= 0 && (
            <Typography variant="caption" display="block" textAlign="center" mt={1}>
              {Math.round(progress)}%
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default LoadingOverlay;
