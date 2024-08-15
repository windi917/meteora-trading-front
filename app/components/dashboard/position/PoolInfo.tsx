import { SOL_MINT, USDC_MINT } from '@/app/config';
import { MeteoraContext } from '@/app/Provider/MeteoraProvider';
import { getDecimals, getMetadataUri } from '@/app/utiles';
import { PublicKey } from '@solana/web3.js';
import React, { useState, useEffect, useContext } from 'react';

function PoolInfo() {
    const [xUrl, setXUrl] = useState('');
    const [yUrl, setYUrl] = useState('');
    const [xDecimal, setXDecimal] = useState(0);
    const [yDecimal, setYDecimal] = useState(0);
    const { mtPair } = useContext(MeteoraContext);

    useEffect(() => {
        const fetchMetadataUris = async () => {
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

            const xDecimals = await getDecimals(mtPair.mint_x);
            const yDecimals = await getDecimals(mtPair.mint_y);

            if (!xDecimals.success || !yDecimals.success) {
                return;
            }

            setXDecimal(xDecimals.decimals)
            setYDecimal(yDecimals.decimals)
        };

        fetchMetadataUris();
    }, [mtPair]);

    return (
        <div className="m-8 p-6" style={{ display: 'flex', flexFlow: 'row', justifyContent: 'center', borderBottom: '2px solid #e0e0e0', borderRadius: '8px' }}>
            <div className="pr-40">
                <h2>Pool TVL</h2>
                <h1 style={{ fontSize: '2rem', margin: '10px 0' }}>${Number(mtPair?.liquidity).toFixed(2)}</h1>
                <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '20px' }}>
                    <h3>Liquidity Allocation</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <img src={xUrl} alt={mtPair ? mtPair.name.split('-')[0] : ''} style={{ width: '24px', height: '24px', marginRight: '10px' }} />
                            <span>{mtPair ? mtPair.name.split('-')[0] : ''}</span>
                        </div>
                        <span className='pl-12'>
                            {mtPair && mtPair.reserve_x_amount !== undefined && mtPair.reserve_x_amount !== null
                                ? Number(mtPair.reserve_x_amount / (10 ** xDecimal)).toFixed(2)
                                : 0}
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <img src={yUrl} alt={mtPair ? mtPair.name.split('-')[1] : ''} style={{ width: '24px', height: '24px', marginRight: '10px' }} />
                            <span>{mtPair ? mtPair.name.split('-')[1] : ''}</span>
                        </div>
                        <span className='pl-12'>
                            {mtPair && mtPair.reserve_y_amount !== undefined && mtPair.reserve_y_amount !== null
                                ? Number(mtPair.reserve_y_amount / (10 ** yDecimal)).toFixed(2)
                                : 0}
                        </span>
                    </div>
                </div>
            </div>
            <div style={{ display: 'flex', flexFlow: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span>Bin Step</span>
                    <span className='pl-12'>{Number(mtPair?.bin_step).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span>Base Fee</span>
                    <span className='pl-12'>{Number(mtPair?.base_fee_percentage).toFixed(2)}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span>Max Fee</span>
                    <span className='pl-12'>{Number(mtPair?.max_fee_percentage).toFixed(2)}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span>Protocol Fee</span>
                    <span className='pl-12'>{Number(mtPair?.protocol_fee_percentage).toFixed(2)}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', fontWeight: 'bold' }}>
                    <span>24h Fee</span>
                    <span className='pl-12'>${Number(mtPair?.fees_24h).toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

export default PoolInfo;