import React, { useState, useEffect, useContext } from 'react';
import Image from 'next/image';
import { Oval } from "react-loader-spinner";
import { toast } from "react-toastify";
import { Box, Button, Typography, TextField, Radio, RadioGroup, FormControlLabel } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Formik, Form, Field } from 'formik';
import { styled } from '@mui/system';
import { BN } from '@coral-xyz/anchor';

import { MTActiveBin, MTPair, MTPosition, SOL_MINT, USDC_MINT } from '@/app/config';
import { getBinIdByPrice, getPriceByBinId, getBalances, addPosition, addLiquidity, getBinArrays } from '@/app/api/api';
import { JwtTokenContext } from '@/app/Provider/JWTTokenProvider';
import { PublicKey } from '@solana/web3.js';
import { getDecimals, getMetadataUri } from '@/app/utiles';

interface AddPositionProps {
  position: MTPosition | undefined;
  mtPair: MTPair | undefined;
  activeBin: MTActiveBin | undefined;
  refresh: boolean;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}

interface CustomRadioProps {
  checked: boolean;
}

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

const StyledTextField = styled(TextField)`
  & .MuiOutlinedInput-root {
    & fieldset {
      border-color: #ffffff;
    }
    &:hover fieldset {
      border-color: #ffffff;
    }
    &.Mui-focused fieldset {
      border-color: #ffffff;
    }
    & input {
      color: #ffffff;  // Input text color
    }
  }
  & .MuiInputLabel-outlined {
    color: #ffffff;  // Label text color
  }
  & .MuiInputBase-input {
    color: #ffffff;  // Input text color for focused state
  }
`;

const strategyDescription = [
  "Spot provides a uniform distribution that is versatile and risk-adjusted, suitable for any type of market and conditions. This is similar to setting a CLMM price range.",
  "Curve is ideal for a concentrated approach that aims to maximise capital efficiency. This is great for stables or pairs where the price does not change very often.",
  "Bid-Ask is an inverse Curve distribution, typically deployed single sided for a DCA in or out strategy. It can be used to capture volatility especially when prices vastly move out of the typical range."
]

interface BinData {
  binId: number;
  price: number;
  pricePerToken: number;
  supply: BN;
  xAmount: BN;
  yAmount: BN;
}

function AddPosition({ mtPair, position, activeBin, refresh, setRefresh }: AddPositionProps) {
  const [loading, setLoading] = useState(false);
  const [xBalance, setXBalance] = useState(0);
  const [yBalance, setYBalance] = useState(0);
  const [xAmount, setXAmount] = useState(0);
  const [yAmount, setYAmount] = useState(0);
  const [selectedStrategy, setSelectedStrategy] = useState('SPOT');
  const [selectedToken, setSelectedToken] = useState('SOL');
  const { jwtToken } = useContext(JwtTokenContext);

  const [minBinId, setMinBinId] = useState(0);
  const [maxBinId, setMaxBinId] = useState(0);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [xUrl, setXUrl] = useState('');
  const [yUrl, setYUrl] = useState('');
  const [binArrays, setBinArrays] = useState<BinData[]>([])

  let disableDeposit = 'none';
  if (activeBin) {
    if (position !== undefined) {
      if (activeBin.pricePerToken > position.positionBinData[position.positionBinData.length - 1].pricePerToken) {
        disableDeposit = 'base';
      }
      if (activeBin.pricePerToken < position.positionBinData[0].pricePerToken) {
        disableDeposit = 'quote';
      }
    }
  }

  const fetchBalance = async () => {
    if (mtPair === undefined)
      return;

    const resX = await getBalances(mtPair.mint_x);
    if (resX.success === false) {
      toast.error("Get Balances fail!");
      return;
    }

    setXBalance(resX.response.balance);

    const resY = await getBalances(mtPair.mint_y);
    if (resY.success === false) {
      toast.error("Get Balances fail!");
      return;
    }

    setYBalance(resY.response.balance);
  }

  useEffect(() => {
    const fetchData = async () => {
      await fetchBalance();

      if (!mtPair)
        return;

      if (mtPair.name.split("-").length === 2) {
        let mintXUri;
        if (mtPair.mint_x === SOL_MINT)
          mintXUri = 'https://exponential.imgix.net/icons/assets/SOL_color.jpg?auto=format&fit=max&w=256';
        else if (mtPair.mint_x === USDC_MINT)
          mintXUri = 'https://exponential.imgix.net/icons/assets/USDC_color.jpg?auto=format&fit=max&w=256';
        else mintXUri = await getMetadataUri(new PublicKey(mtPair.mint_x));

        let mintYUri;
        if (mtPair.mint_y === SOL_MINT)
          mintYUri = 'https://exponential.imgix.net/icons/assets/SOL_color.jpg?auto=format&fit=max&w=256';
        else if (mtPair.mint_y === USDC_MINT)
          mintYUri = 'https://exponential.imgix.net/icons/assets/USDC_color.jpg?auto=format&fit=max&w=256';
        else mintYUri = await getMetadataUri(new PublicKey(mtPair.mint_y));

        setXUrl(mintXUri);
        setYUrl(mintYUri);
      }

      const minBin = (position !== undefined ? position.lowerBinId : (activeBin ? activeBin.binId - 34 : 0));
      const maxBin = (position !== undefined ? position.upperBinId : (activeBin ? activeBin.binId + 34 : 0));

      const minP = await getPriceByBinId(mtPair.address, minBin);
      const maxP = await getPriceByBinId(mtPair.address, maxBin);

      if (minP.success === false || maxP.success === false) {
        toast.error("Get Price by Bin ID fail!");
        return;
      }

      setMinBinId(minBin);
      setMaxBinId(maxBin);
      setMinPrice(Number(minP.response.price) * 1000.0);
      setMaxPrice(Number(maxP.response.price) * 1000.0);

      // fetch bin arrays
      const res = await getBinArrays(mtPair.address, minBin, maxBin);
      if (res.success === false) {
        toast.error("Get Bin Arrays Error!");
        return;
      }

      setBinArrays(res.response.binArrays.bins);
    };

    fetchData(); // Call the async function
  }, [refresh, setRefresh])

  const handleStrategyChange = (value: string) => {
    setSelectedStrategy(value);
  };

  const handleMinIdChanged = async (e: any) => {
    setMinPrice(Number(e.target.value));
    if (!mtPair)
      return;

    const binId = await getBinIdByPrice(mtPair.address, Number(e.target.value) / 1000.0);

    if (binId.success === false)
      return;

    setMinBinId(binId.response.binId);
  }

  const handleMaxIdChanged = async (e: any) => {
    setMaxPrice(Number(e.target.value));
    if (!mtPair)
      return;

    const binId = await getBinIdByPrice(mtPair.address, Number(e.target.value) / 1000.0);

    if (binId.success === false)
      return;

    setMaxBinId(binId.response.binId);
  }

  const handleAddLiquidity = async () => {
    if (!mtPair || !activeBin) {
      toast.error("Pool or ActiveBin invalid!");
      return;
    }

    const xDecimals = await getDecimals(mtPair.mint_x);
    const yDecimals = await getDecimals(mtPair.mint_y);

    if (!xDecimals.success || !yDecimals.success) {
      toast.error("Get Decimals Error!");
      return;
    }
    const xAmountLamport = xAmount * (10 ** xDecimals.decimals);
    const yAmountLamport = yAmount * (10 ** yDecimals.decimals);

    setLoading(true);
    if (position === undefined) {
      const res = await addPosition(jwtToken, mtPair.address, selectedStrategy, xAmountLamport, yAmountLamport, minBinId, maxBinId);
      if (res.success === false)
        toast.error("Add Position Fail!");
      else {
        toast.success("Add Position Success!");
        setRefresh(!refresh);
      }
    }
    else {
      const res = await addLiquidity(jwtToken, mtPair.address, position.address, selectedStrategy, xAmountLamport, yAmountLamport, position.lowerBinId, position.upperBinId);
      if (res.success === false)
        toast.error("Add Liquidity Fail!");
      else {
        toast.success("Add Liquidity Success!");
        setRefresh(!refresh);
      }
    }
    setLoading(false);
  }

  let data;
  let charData = [];
  for (let i = minBinId; i <= maxBinId; i++) {
    const bin = binArrays.find(e => e.binId === i);

    if (!bin)
      continue;

    const binXAmount = parseInt(bin.xAmount.toString(), 16);
    const binYAmount = parseInt(bin.yAmount.toString(), 16);

    charData[i - minBinId] = {
      'name': bin?.pricePerToken,
      'value': binXAmount === 0 ? binYAmount : binXAmount
    }
  }

  data = charData;

  return (
    <div className="add-position max-w-3xl mx-auto ">
      {position === undefined ? null : (
        <>
          <p>Enter deposit amount</p>
          <div className="position-border flex justify-between pt-6">
            <div className="position-input">
              <div className="position-deposit flex pb-2">
                <div className="flex" style={{ alignItems: 'center' }}>
                  <Image src={xUrl} alt="X Logo" width={40} height={40} />
                  <p className="font-m pl-2 pr-4">{mtPair ? mtPair.name.split('-')[0] : ''}</p>
                </div>
                {disableDeposit === 'base' ? (
                  <input
                    type="number"
                    id="mintx"
                    value={0}
                    disabled={true}
                  />
                ) : (
                  <input
                    type="number"
                    id="mintx"
                    value={xAmount}
                    onChange={(e) => setXAmount(parseFloat(e.target.value))}
                  />
                )}
              </div>
              <div className="flex justify-between">
                <p>Balance: {xBalance}</p>
                <div className="quickButtons">
                  <button className="font-s" onClick={() => setXAmount(xBalance)}>MAX</button>
                  <button className="font-s" onClick={() => setXAmount(xBalance / 2)}>HALF</button>
                </div>
              </div>
            </div>
            <div className="position-input">
              <div className="position-deposit flex pb-2">
                <div className="flex" style={{ alignItems: 'center' }}>
                  <Image src={yUrl} alt="Y Logo" width={40} height={40} />
                  <p className="font-m pl-2 pr-4">{mtPair ? mtPair.name.split('-')[1] : ''}</p>
                </div>
                {disableDeposit === 'quote' ? (
                  <input
                    type="number"
                    id="minty"
                    value={0}
                    disabled
                  />
                ) : (
                  <input
                    type="number"
                    id="minty"
                    value={yAmount}
                    onChange={(e) => setYAmount(parseFloat(e.target.value))}
                  />
                )}
              </div>
              <div className="flex justify-between">
                <p>Balance: {yBalance}</p>
                <div className="quickButtons">
                  <button className="font-s" onClick={() => setYAmount(yBalance)}>MAX</button>
                  <button className="font-s" onClick={() => setYAmount(yBalance / 2)}>HALF</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      <Container className="max-w-3xl mx-auto">
        <SectionTitle variant="h6">Select Volatility Strategy</SectionTitle>
        <DescriptionContainer>
          <DescriptionText>
            {selectedStrategy === "SPOT" ? strategyDescription[0] : (selectedStrategy === "CURVE" ? strategyDescription[1] : strategyDescription[2])}
          </DescriptionText>
          <RadioContainer>
            <CustomRadio checked={selectedStrategy === 'SPOT'} onClick={() => handleStrategyChange('SPOT')}>
              <img src="/spot.png" alt="Spot" />
              <span>Spot</span>
            </CustomRadio>
            <CustomRadio checked={selectedStrategy === 'CURVE'} onClick={() => handleStrategyChange('CURVE')}>
              <img src="/curve.png" alt="Curve" />
              <span>Curve</span>
            </CustomRadio>
            <CustomRadio checked={selectedStrategy === 'BIDASK'} onClick={() => handleStrategyChange('BIDASK')}>
              <img src="/bidask.png" alt="Bid Ask" />
              <span>Bid Ask</span>
            </CustomRadio>
          </RadioContainer>
        </DescriptionContainer>

        <SectionTitle variant="h6">Set Price Range</SectionTitle>
        <RadioGroup row value={selectedToken} onChange={(e) => setSelectedToken(e.target.value)}>
          <RadioContainer>
            <FormControlLabel
              value={mtPair ? mtPair.name.split('-')[0] : ''}
              control={<Radio color="primary" />}
              label={mtPair ? mtPair.name.split('-')[0] : ''}
            />
            <FormControlLabel
              value={mtPair ? mtPair.name.split('-')[1] : ''}
              control={<Radio color="primary" />}
              label={mtPair ? mtPair.name.split('-')[1] : ''}
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
          initialValues={{ minPrice: minPrice, maxPrice: maxPrice, numBins: maxBinId - minBinId + 1 }}
          onSubmit={(values) => {
            console.log(values);
          }}
        >
          {() => (
            <Form>
              <FormContainer>
                <Box display="flex" justifyContent="space-between" gap={2}>
                  <Field as={StyledTextField}
                    name="minPrice"
                    label="Min Bin Id"
                    variant="outlined"
                    fullWidth
                    style={{ color: '#ffffff' }}
                    value={minPrice}
                    onChange={handleMinIdChanged}
                  />
                  <Field as={StyledTextField}
                    name="maxPrice"
                    label="Max Bin Id"
                    variant="outlined"
                    fullWidth
                    style={{ color: '#ffffff' }}
                    value={maxPrice}
                    onChange={handleMaxIdChanged}
                  />
                  <Field as={StyledTextField} name="numBins" label="Num Bins" variant="outlined" fullWidth value={maxBinId - minBinId + 1} />
                </Box>
                <Box display="flex" justifyContent="center" mt={2}>
                  <Button variant="contained" color="primary" onClick={handleAddLiquidity}>
                    Add Liquidity
                  </Button>
                </Box>
              </FormContainer>
            </Form>
          )}
        </Formik>
      </Container>
      {loading && (
        <>
          <div style={{
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: "1000"
          }}>
            <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
              <Oval
                height="80"
                visible={true}
                width="80"
                color="#CCF869"
                ariaLabel="oval-loading"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AddPosition;