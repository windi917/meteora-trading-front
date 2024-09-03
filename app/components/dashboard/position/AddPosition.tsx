import React, { useState, useEffect, useContext } from 'react';
import Image from 'next/image';
import { Oval } from "react-loader-spinner";
import { toast } from "react-toastify";
import { Box, Button, Typography, TextField } from '@mui/material';
import { TooltipProps } from 'recharts';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Formik, Form, Field } from 'formik';
import { styled } from '@mui/system';
import { BN } from '@coral-xyz/anchor';
import { SOL_DECIMALS, SOL_MINT, USDC_DECIMALS, USDC_MINT } from '@/app/config';
import { getBinIdByPrice, getPriceByBinId, getBalances, addPosition, addLiquidity, getBinArrays, getPoolDepositRole, jupiterSwapApi, getUserDepositAmountApi } from '@/app/api/api';
import { JwtTokenContext } from '@/app/Provider/JWTTokenProvider';
import { PublicKey } from '@solana/web3.js';
import { getDecimals, getMetadataUri } from '@/app/utiles';
import { MeteoraContext } from '@/app/Provider/MeteoraProvider';
import RangeSlider from '../../Progress';
import { useWallet } from '@solana/wallet-adapter-react';

interface AddPositionProps {
  positionAddr: string;
}

interface CustomRadioProps {
  checked: boolean;
}

const Container = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(4),
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  fontWeight: 'bold',
  fontSize: '1rem',
  [theme.breakpoints.up('md')]: {
    fontSize: '1.25rem',
  },
}));

const RadioContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  gap: theme.spacing(2),
  flexWrap: 'wrap',
  justifyContent: 'center',
}));

const DescriptionContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  gap: theme.spacing(2),
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
  },
}));

const DescriptionText = styled(Box)(({ theme }) => ({
  flex: 1,
  fontSize: '0.875rem',
  textAlign: 'center',
  [theme.breakpoints.up('md')]: {
    fontSize: '1rem',
    textAlign: 'left',
  },
}));

const FormContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

const CustomRadio = styled(Box, { shouldForwardProp: (prop) => prop !== 'checked' })<CustomRadioProps>(({ theme, checked }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(2),
  border: checked ? '2px solid #f0f0f0' : '2px solid transparent',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'border 0.3s',
  width: '80px',
  '& img': {
    width: '50px',
    height: 'auto',
  },
  '& span': {
    marginTop: theme.spacing(1),
    fontSize: '0.75rem',
  },
}));

const CustomTooltip = (props: TooltipProps<any, any>) => {
  const { active, payload, label } = props;

  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: '#000', border: '1px solid #ccc', padding: '10px', borderRadius: '4px' }}>
        <p className="label">{`Price: ${label}`}</p>
        <p className="intro">{`Value: ${payload[0].value}`}</p>
      </div>
    );
  }

  return null;
};

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: '#ffffff',
    },
    '&:hover fieldset': {
      borderColor: '#ffffff',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#ffffff',
    },
    '&.Mui-disabled': {
      '& fieldset': {
        borderColor: 'gray',
      },
      '& .MuiOutlinedInput-input': {
        color: 'gray !important',
        opacity: 1,
        WebkitTextFillColor: 'gray',
      },
    },
  },
  '& .MuiInputLabel-outlined': {
    color: '#ffffff',
  },
  '& .MuiInputLabel-outlined.Mui-disabled': {
    color: 'gray !important',
  },
  '& .MuiInputBase-input': {
    color: '#ffffff',
  },
}));

const strategyDescription = [
  "Spot provides a uniform distribution that is versatile and risk-adjusted, suitable for any type of market and conditions. This is similar to setting a CLMM price range.",
  "Curve is ideal for a concentrated approach that aims to maximise capital efficiency. This is great for stables or pairs where the price does not change very often.",
  "Bid-Ask is an inverse Curve distribution, typically deployed single sided for a DCA in or out strategy. It can be used to capture volatility especially when prices vastly move out of the typical range."
];

interface BinData {
  binId: number;
  price: number;
  pricePerToken: number;
  supply: BN;
  xAmount: BN;
  yAmount: BN;
}

function AddPosition({ positionAddr }: AddPositionProps) {
  const { positions, mtPair, activeBin } = useContext(MeteoraContext);
  const [loading, setLoading] = useState(false);
  const [solBalance, setSolBalance] = useState(0);
  const [usdcBalance, setUSDCBalance] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [xDecimal, setXDecimal] = useState(0);
  const [yDecimal, setYDecimal] = useState(0);
  const [selectedStrategy, setSelectedStrategy] = useState('SPOT');
  const { jwtToken } = useContext(JwtTokenContext);

  const [minBinId, setMinBinId] = useState(0);
  const [maxBinId, setMaxBinId] = useState(0);
  const [fixMinId, setFixMinId] = useState(0);
  const [fixMaxId, setFixMaxId] = useState(0);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [xUrl, setXUrl] = useState('');
  const [yUrl, setYUrl] = useState('');
  const [binArrays, setBinArrays] = useState<BinData[]>([]);
  const [selectedDepositToken, setSelectedDepositToken] = useState('SOL');
  const [poolRole, setPoolRole] = useState(0);
  const [selectedOption, setSelectedOption] = useState('XToken');
  const [disableDeposit, setDisableDeposit] = useState('none');

  const wallet = useWallet();

  const handleChange = (e: any) => {
    setSelectedOption(e.target.value);
  };

  const options = ['XToken', 'YToken'];

  const position = positions?.find((e) => e.address === positionAddr);

  useEffect(() => {
    if (activeBin && position !== undefined) {
      if (activeBin.pricePerToken > position.positionBinData[position.positionBinData.length - 1].pricePerToken) {
        setDisableDeposit('base');
        setSelectedOption(options[0]);
      } else if (activeBin.pricePerToken < position.positionBinData[0].pricePerToken) {
        setDisableDeposit('quote');
        setSelectedOption(options[1]);
      } else {
        setDisableDeposit('none');
      }
    }
  }, [activeBin, position, options]);

  const fetchBalance = async () => {
    if (mtPair === undefined) return;

    const resX = await getBalances(SOL_MINT);
    if (resX.success === false) {
      toast.error("Get Balances fail!");
      return;
    }

    setSolBalance(resX.response.balance);

    const resY = await getBalances(USDC_MINT);
    if (resY.success === false) {
      toast.error("Get Balances fail!");
      return;
    }

    setUSDCBalance(resY.response.balance);
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchBalance();

      if (!mtPair) return;

      // Get Pool deposit role
      const poolRoleRes = await getPoolDepositRole(mtPair.address);
      if (!poolRoleRes.success) {
        toast.error("Get Pool Role Error!");
        return;
      }

      let sol_usdc = 0;
      if (poolRoleRes) sol_usdc = poolRoleRes.response.sol_usdc;

      if (sol_usdc === 0 || sol_usdc === 1) setSelectedDepositToken('SOL');
      else setSelectedDepositToken('USDC');

      setPoolRole(sol_usdc);

      const xDecimals = await getDecimals(mtPair.mint_x);
      const yDecimals = await getDecimals(mtPair.mint_y);
      if (!xDecimals.success || !yDecimals.success) {
        toast.error("Get Decimals Error!");
        return;
      }

      setXDecimal(xDecimals.decimals);
      setYDecimal(yDecimals.decimals);

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

      const minBin = position !== undefined ? position.lowerBinId : activeBin ? activeBin.binId - 34 : 0;
      const maxBin = position !== undefined ? position.upperBinId : activeBin ? activeBin.binId + 34 : 0;

      const minP = await getPriceByBinId(mtPair.address, minBin);
      const maxP = await getPriceByBinId(mtPair.address, maxBin);

      if (minP.success === false || maxP.success === false) {
        toast.error("Get Price by Bin ID fail!");
        return;
      }

      setMinBinId(minBin);
      setMaxBinId(maxBin);
      setFixMinId(minBin);
      setFixMaxId(maxBin);
      setMinPrice(Number(minP.response.price));
      setMaxPrice(Number(maxP.response.price));

      // fetch bin arrays
      const res = await getBinArrays(mtPair.address, minBin, maxBin);
      if (res.success === false) {
        toast.error("Get Bin Arrays Error!");
        return;
      }

      setBinArrays(res.response.binArrays.bins);
    };

    fetchData(); // Call the async function
  }, []);

  const handleStrategyChange = (value: string) => {
    setSelectedStrategy(value);
  };

  const handleAddLiquidity = async () => {
    if (!mtPair || !activeBin || !wallet.publicKey) {
      toast.error("Pool or ActiveBin invalid!");
      return;
    }

    if (position && depositAmount <= 0) {
      toast.error("Input deposit amount correctly!");
      return;
    }
    if ((selectedDepositToken === 'SOL' && depositAmount > solBalance) ||
      (selectedDepositToken === 'USDC' && depositAmount > usdcBalance)) {
      toast.error("Funds not enough!");
      return;
    }

    setLoading(true);

    if (position === undefined) {
      const res = await addPosition(jwtToken, mtPair.address, selectedStrategy, 0, 0, minBinId, maxBinId);
      if (res.success === false) toast.error("Add Position Fail!");
      else {
        fetchBalance();
        toast.success("Add Position Success!");
      }
    } else {
      const userDepositRes = await getUserDepositAmountApi();
      if (!userDepositRes.success) {
        setLoading(false);
        toast.error("Get user deposit error!");
        return;
      }

      if ((selectedDepositToken === "SOL" && userDepositRes.response.sol < depositAmount) ||
        (selectedDepositToken === "USDC" && userDepositRes.response.usdc < depositAmount)) {
        setLoading(false);
        toast.error("Deposit Amount not enough!");
        return;
      }

      let xAmountLamport = 0;
      let yAmountLamport = 0;

      if (selectedDepositToken === 'SOL' && ((selectedOption === 'XToken' && mtPair.mint_x === SOL_MINT) || (selectedOption === 'YToken' && mtPair.mint_y === SOL_MINT))) {
        xAmountLamport = depositAmount;
      } else if (selectedDepositToken === 'USDC' && ((selectedOption === 'XToken' && mtPair.mint_x === USDC_MINT) || (selectedOption === 'YToken' && mtPair.mint_y === USDC_MINT))) {
        yAmountLamport = depositAmount;
      } else {
        const swapRes = await jupiterSwapApi(
          jwtToken,
          selectedDepositToken === 'SOL' ? SOL_MINT : USDC_MINT,
          selectedOption === 'XToken' ? mtPair.mint_x : mtPair.mint_y,
          selectedDepositToken === 'SOL' ? depositAmount * (10 ** SOL_DECIMALS) : depositAmount * (10 ** USDC_DECIMALS)
        );

        if (!swapRes.success) {
          toast.error("Jupiter swap error!");
          setLoading(false);
          return;
        }

        xAmountLamport = selectedOption === 'XToken' ? swapRes.outAmount - 100000 : 0;
        yAmountLamport = selectedOption === 'YToken' ? swapRes.outAmount - 100000 : 0;
      }

      const res = await addLiquidity(jwtToken, mtPair.address, position.address, selectedStrategy, xAmountLamport, yAmountLamport, position.lowerBinId, position.upperBinId, selectedDepositToken, depositAmount);
      if (res.success === false) toast.error("Add Liquidity Fail!");
      else {
        fetchBalance();
        toast.success("Add Liquidity Success!");
      }
    }
    setLoading(false);
  };

  const handleDepositTokenChange = (e: any) => {
    setSelectedDepositToken(e.target.value);
  };

  let chartData = [];
  let gap = 0;
  if (maxBinId - minBinId < 69) gap = Math.floor((69 - (maxBinId - minBinId)) / 2);

  for (let i = minBinId - gap; i < maxBinId + (69 - (maxBinId - minBinId) - gap); i++) {
    const bin = binArrays.find(e => e.binId === i);

    let binXAmount = bin ? parseInt(bin.xAmount.toString(), 16) : 0;
    let binYAmount = bin ? parseInt(bin.yAmount.toString(), 16) : 0;

    if (i < minBinId || i > maxBinId) {
      binXAmount = 0;
      binYAmount = 0;
    }

    chartData[i - (minBinId - gap)] = {
      'name': bin?.pricePerToken,
      'value': (binYAmount / (10 ** xDecimal) + binXAmount / (10 ** yDecimal)),
    };
  }

  const maxBin = binArrays.find(e => e.binId === maxBinId);
  const minBin = binArrays.find(e => e.binId === minBinId);

  return (
    <div className="max-w-full md:max-w-3xl mx-auto px-4">
      {position === undefined ? null : (
        <>
          <Typography variant="h6" className="mb-2">Enter deposit amount</Typography>
          <div className="position-border flex flex-col md:flex-row justify-between gap-4 pt-4">
            <div className="position-input w-full md:w-1/2">
              <div className="position-deposit flex md:flex-row items-center gap-2 pb-2">
                <select className="currencySelect" value={selectedDepositToken} onChange={handleDepositTokenChange}>
                  {poolRole === 0 ? (
                    <>
                      <option value="SOL">SOL</option>
                      <option value="USDC">USDC</option>
                    </>
                  ) : (
                    <>
                      {poolRole === 1 ? (
                        <option value="SOL">SOL</option>
                      ) : (
                        <option value="USDC">USDC</option>
                      )}
                    </>
                  )}
                </select>
                <input
                  type="number"
                  id="deposit"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(parseFloat(e.target.value))}
                  className="w-full md:w-auto"
                />
              </div>
              <div className="flex justify-between items-center">
                <p>Balance: {selectedDepositToken === 'SOL' ? solBalance : usdcBalance}</p>
                <div className="quickButtons">
                  <button className="font-s" onClick={() => setDepositAmount(selectedDepositToken === 'SOL' ? solBalance : usdcBalance)}>MAX</button>
                  <button className="font-s" onClick={() => setDepositAmount((selectedDepositToken === 'SOL' ? solBalance : usdcBalance) / 2)}>HALF</button>
                </div>
              </div>
            </div>
            <div className="position-input w-full md:w-1/2">
              <div className="position-deposit flex flex-col md:flex-row items-center gap-2">
                {disableDeposit === 'base' ? null : (
                  <div className="option-container flex items-center">
                    <input
                      type="radio"
                      id="option1"
                      name="position"
                      value={options[0]}
                      checked={selectedOption === options[0]}
                      onChange={handleChange}
                      className="custom-radio"
                    />
                    <label htmlFor="option1" className="custom-label flex items-center">
                      <Image src={xUrl} alt="X Logo" width={40} height={40} />
                      <p className="font-m pl-2">{mtPair ? mtPair.name.split('-')[0] : ''}</p>
                    </label>
                  </div>
                )}
                {disableDeposit === 'quote' ? null : (
                  <div className="option-container flex items-center">
                    <input
                      type="radio"
                      id="option2"
                      name="position"
                      value={options[1]}
                      checked={selectedOption === options[1]}
                      onChange={handleChange}
                      className="custom-radio"
                    />
                    <label htmlFor="option2" className="custom-label flex items-center">
                      <Image src={yUrl} alt="Y Logo" width={40} height={40} />
                      <p className="font-m pl-2">{mtPair ? mtPair.name.split('-')[1] : ''}</p>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <Container>
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
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>

        {position === undefined ? null : (
          <RangeSlider
            min={fixMinId}
            max={fixMaxId}
            minValue={minBinId}
            maxValue={maxBinId}
            onMinValueChange={setMinBinId}
            onMaxValueChange={setMaxBinId}
          />
        )}

        <Typography variant="body1" align="center" className="mt-4">
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
                <Box display="flex" flexDirection="column" gap={2}>
                  <Field as={StyledTextField}
                    name="minPrice"
                    label="Min Price"
                    variant="outlined"
                    fullWidth
                    value={minBin ? minBin.pricePerToken : 0}
                    disabled={position === undefined ? false : true}
                    onChange={(e: any) => setMinPrice(e.target.value)}
                  />
                  <Field as={StyledTextField}
                    name="maxPrice"
                    label="Max Price"
                    variant="outlined"
                    fullWidth
                    value={maxBin ? maxBin.pricePerToken : 0}
                    disabled={position === undefined ? false : true}
                    onChange={(e: any) => setMaxPrice(e.target.value)}
                  />
                  <Field as={StyledTextField}
                    name="numBins"
                    label="Num Bins"
                    variant="outlined"
                    fullWidth
                    disabled
                    value={maxBinId - minBinId + 1}
                  />
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
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-50">
          <Oval height="80" visible={true} width="80" color="#CCF869" ariaLabel="oval-loading" />
        </div>
      )}
    </div>
  );
};

export default AddPosition;
