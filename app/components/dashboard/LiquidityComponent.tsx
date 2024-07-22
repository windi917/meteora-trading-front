// components/LiquidityComponent.js
import React, { useState } from 'react';
import { Box, Button, Typography, TextField, Radio, RadioGroup, FormControlLabel } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Formik, Form, Field } from 'formik';
import { styled } from '@mui/system';

interface CustomRadioProps {
  checked: boolean;
}

// Sample data for the chart
const data = [
  { name: '150.16', value: 30 },
  { name: '151.12', value: 50 },
  { name: '152.09', value: 45 },
  { name: '153.06', value: 60 },
  { name: '154.05', value: 70 },
  { name: '155.03', value: 90 },
  { name: '156.03', value: 100 },
  { name: '157.03', value: 80 },
  { name: '158.04', value: 60 },
  { name: '159.05', value: 40 },
  { name: '160.07', value: 20 },
  { name: '161.10', value: 30 },
  { name: '162.13', value: 40 },
  { name: '163.17', value: 50 },
  { name: '164.22', value: 20 },
  { name: '165.27', value: 10 },
];

const Container = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  fontWeight: 'bold',
}));

const RadioContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row', 
  gap: theme.spacing(3), // Adjust the gap between items
}));

const DescriptionContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center', // Align items to the start
  marginBottom: theme.spacing(2),
  gap: theme.spacing(3), // Adjust the space between description and radio buttons
}));

const DescriptionText = styled(Box)(({ theme }) => ({
  flex: '1',
  fontSize: '14px',
  lineHeight: 1.5,
}));

const ChartContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const FormContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

const CustomRadio = styled(Box, { shouldForwardProp: (prop) => prop !== 'checked' })<CustomRadioProps>(({ theme, checked }) => ({
  display: 'flex',
  flexDirection: 'column', 
  alignItems: 'center', // Align items horizontally
  padding: theme.spacing(2),
  border: checked ? '2px solid #f0f0f0' : '2px solid transparent',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'border 0.3s',
  '& img': {
    width: '50px',
    height: 'auto',
    marginLeft: theme.spacing(2),
  },
  '& span': {
    marginTop: theme.spacing(1),
    fontSize: '14px',
  },
}));

const strategyDescription = [
  "Spot provides a uniform distribution that is versatile and risk-adjusted, suitable for any type of market and conditions. This is similar to setting a CLMM price range.",
  "Curve is ideal for a concentrated approach that aims to maximise capital efficiency. This is great for stables or pairs where the price does not change very often.",
  "Bid-Ask is an inverse Curve distribution, typically deployed single sided for a DCA in or out strategy. It can be used to capture volatility especially when prices vastly move out of the typical range."
]

const LiquidityComponent = () => {
  const [selectedStrategy, setSelectedStrategy] = useState('spot');
  const [selectedToken, setSelectedToken] = useState('SOL');

  const handleStrategyChange = (value: string) => {
    setSelectedStrategy(value);
  };

  return (
    <Container className="max-w-3xl mx-auto">
      <SectionTitle variant="h6">Select Volatility Strategy</SectionTitle>
      <DescriptionContainer>
        <DescriptionText>
          {selectedStrategy === "SPOT" ? strategyDescription[0] : (selectedStrategy === "curve" ? strategyDescription[1] : strategyDescription[2])}
        </DescriptionText>
        <RadioContainer>
          <CustomRadio checked={selectedStrategy === 'spot'} onClick={() => handleStrategyChange('spot')}>
            <img src="/spot.png" alt="Spot" />
            <span>Spot</span>
          </CustomRadio>
          <CustomRadio checked={selectedStrategy === 'curve'} onClick={() => handleStrategyChange('curve')}>
            <img src="/curve.png" alt="Curve" />
            <span>Curve</span>
          </CustomRadio>
          <CustomRadio checked={selectedStrategy === 'bidask'} onClick={() => handleStrategyChange('bidask')}>
            <img src="/bidask.png" alt="Bid Ask" />
            <span>Bid Ask</span>
          </CustomRadio>
        </RadioContainer>
      </DescriptionContainer>

      <SectionTitle variant="h6">Set Price Range</SectionTitle>
      <RadioGroup row value={selectedToken} onChange={(e) => setSelectedToken(e.target.value)}>
        <RadioContainer>
          <FormControlLabel
            value="SOL"
            control={<Radio color="primary" />}
            label="SOL"
          />
          <FormControlLabel
            value="USDC"
            control={<Radio color="primary" />}
            label="USDC"
          />
        </RadioContainer>
      </RadioGroup>

      <ChartContainer>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      <Typography variant="body1" align="center">
        You don&#39;t have liquidity in this position
      </Typography>
      <Formik
        initialValues={{ minPrice: '', maxPrice: '', numBins: '' }}
        onSubmit={(values) => {
          console.log(values);
        }}
      >
        {() => (
          <Form>
            <FormContainer>
              <Box display="flex" justifyContent="space-between" gap={2}>
                <Field as={TextField} name="minPrice" label="Min Bin Id" variant="outlined" fullWidth />
                <Field as={TextField} name="maxPrice" label="Max Bin Id" variant="outlined" fullWidth />
                <Field as={TextField} name="numBins" label="Num Bins" variant="outlined" fullWidth />
              </Box>
              <Box display="flex" justifyContent="center" mt={2}>
                <Button type="submit" variant="contained" color="primary">
                  Add Liquidity
                </Button>
              </Box>
            </FormContainer>
          </Form>
        )}
      </Formik>
    </Container>
  );
};

export default LiquidityComponent;
