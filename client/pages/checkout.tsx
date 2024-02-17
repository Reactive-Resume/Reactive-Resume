`use client`;
import { TextField } from '@mui/material';
import dayjs from 'dayjs';
import { NextPage } from 'next';
import { useRouter } from 'next/dist/client/router';
import React, { useEffect, useState } from 'react';
import { pdfjs } from 'react-pdf';
import { Document, Page } from 'react-pdf';
import { useMutation } from 'react-query';

import { checkoutMain } from '@/services/auth';
import { ServerError } from '@/services/axios';
import { printResumeAsPdf, PrintResumeAsPdfParams } from '@/services/printer';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import styles from '@/styles/pages/checkout.module.scss';
import { cn } from '@/utils/styles';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).toString();

const CheckoutPage: NextPage = () => {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>();
  const [errors, seterrors] = useState('');
  const [isSuccess, setIsSuccess] = useState('');
  const [isLoadingPay, setIsLoadingPay] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  const { mutateAsync, isLoading } = useMutation<string, ServerError, PrintResumeAsPdfParams>(printResumeAsPdf);
  const router = useRouter();
  const { phone, slug, username, updatedAt, userId } = router.query;
  console.log(phone);
  const [phonenumber, setNumber] = useState(phone ? phone.toString()?.split('@')[0] : '');
  console.log(phonenumber);
  const dispatch = useAppDispatch();

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  const { errorsGlobal, successGlobal } = useAppSelector((state) => state.auth);

  console.log(errorsGlobal);
  console.log(successGlobal);

  useEffect(() => {
    setNumber(phone ? phone.toString()?.split('@')[0] : '');
    handleExportPDF();
  }, [phone, slug, updatedAt, userId]);

  const handleExportPDF = async () => {
    // const download = (await import('downloadjs')).default;

    // const slug = get(resume, 'slug');
    // const username = get(resume, 'user.username');
    // const updatedAt = get(resume, 'updatedAt');

    if (username && slug && updatedAt) {
      console.log(username.toString());
      console.log(slug.toString());
      console.log(updatedAt.toString());
      const urlData: any = await mutateAsync({
        username: username.toString(),
        slug: slug.toString(),
        lastUpdated: dayjs(updatedAt.toString()).unix().toString(),
        preview: 'true',
      });
      console.log(urlData);

      //   if (urlData.status === '412') {
      //   }
      setPdfUrl(urlData.url);
    }
    // if (urlData.status === '200') {
    //   download(urlData.url);
    // }
    // console.log(url);
    // try {s
    // JSON.parse(url);
    // download(url);
    // } catch (e) {
    //   console.log(e);
    // }
  };

  const onSubmit = () => {
    let cleanNumber = '';
    seterrors('');
    if (!phonenumber) {
      seterrors('Enter your Mpesa phonenumber to continue');
      return;
    }

    if (phonenumber.substring(0, 1) === '0') {
      cleanNumber = `254${phonenumber.substring(1, phonenumber.length)}`;
    } else {
      cleanNumber = phonenumber;
    }
    console.log(cleanNumber.substring(0, 3));
    if (cleanNumber.substring(0, 3) !== '254') {
      console.log(cleanNumber);
      seterrors('Please enter a valid Mpesa number');
      return;
    }

    // cleanNumber = number;

    const formData: any = {};
    const whatsappNumber: string | null = localStorage.getItem('whatsappNumber');
    if (whatsappNumber !== null) {
      formData.whatsappNumber = whatsappNumber;
    }

    console.log(userId);
    formData.userId = userId;
    formData.slug = slug;
    formData.phonenumber = cleanNumber;
    // if (isEditMode) {
    setIsLoadingPay(true);
    dispatch(
      checkoutMain(
        formData,
        () => {
          // console.log('data');
          //   console.log(data);
          setIsSuccess(
            'We have initiated an STK push for the premium version of your resume to your mobile device. Please follow the instructions on your phone to complete the payment process. Once we receive your payment, the premium product will be activated. This may take a few minutes. Thank you for choosing our premium service.',
          );
          setIsLoadingPay(false);
        },
        () => {
          seterrors('An error occurred while processing your payment kindly check the phonenumber and try again');
          setIsLoadingPay(false);
        },
      ),
    );
    // } else {
    //   //   dispatch(addItem({ path: `${path}.items`, value: formData }));
    // }

    // handleClose();
  };

  return (
    <div className={styles.parent}>
      <div className={styles.container}>
        <div className={styles.itemContainer}>
          <div className={styles.itemImage}>
            <div className={styles.pdfCanva}>
              <Document
                // className={styles.pdfCanva}
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
              >
                <Page pageNumber={1} />
              </Document>
            </div>
            <div className={styles.itemDetails}>
              <h1>Secure Checkout</h1>
              <ul>
                <br />
                <li>
                  - You will instantly receive this CV pdf document on your Whatsapp with no watermark upon payment.
                </li>
                <br />
                <li>
                  - You will also get unlimited access to this resume and download it at any time via download/edit link
                  option on whatsapp.
                </li>
                <br />

                <h4>FAQs</h4>
                <p>
                  <strong>I haven't Received My CV without watermark after Payment?</strong>
                  <br />
                  <span>Kindly share the m-pesa confirmation message to the number 0791186712</span>
                  <br />
                  <strong>I can't Pay the system isn't responding it throws error while paying?</strong>
                  <br />
                  <span> - Pay via Mpesa - Till 5189665</span>
                  <br />
                  <span> - Kindly share the m-pesa confirmation message to the number 0791186712</span>
                </p>
              </ul>
              <h3 className={styles.itemName}>Resume Id: {slug} </h3>
              <hr />

              <div className={styles.itemPrice}>
                {isSuccess && <p>{successGlobal}</p>}
                {!isSuccess && (
                  <form className={styles.checkout_form} onSubmit={() => onSubmit}>
                    <img className={cn(styles.mpesa)} src={`/images/brand-logos/dark/mpesa.svg`} />

                    <TextField
                      required
                      value={phonenumber}
                      onChange={(e) => {
                        setNumber(e.target.value);
                        seterrors('');
                      }}
                      className={styles.mpesa_number}
                      type="tel"
                      label={'M-Pesa Number'}
                      error={errors !== ''}
                      helperText={errors}
                    />
                  </form>
                )}
                <strong>
                  <small>Kes </small>50/=
                </strong>
              </div>
              {/* )} */}
              {/* {successGlobal && <p></p>} */}

              <Button
                className={styles.checkout_btn}
                onClick={() => {
                  !isLoadingPay ? onSubmit() : alert('Kindly as wait we process your order before paying again');
                }}
                text={!isLoadingPay ? 'Buy' : 'Loading'}
              >
                {!isLoadingPay ? 'Buy' : 'Loading'}
              </Button>
            </div>
          </div>
        </div>
        {/* <div className={`${styles.col} ${styles.noGutters}`}>
          <Checkout />
        </div> */}
      </div>
    </div>
  );
};

// const Item = (props: any) => (

// );

const Input = (props: any) => (
  <div className={styles.input}>
    <label>{props.label}</label>
    <div className={styles.inputField}>
      <input type={props.type} name={props.name} />
      <img className={styles.mpesa} src={props.imgSrc} alt="Card Logo" />
    </div>
  </div>
);

const Button = (props: any) => (
  <button onClick={props.onClick} className={styles.checkoutBtn} type="button">
    {props.text}
  </button>
);

export default CheckoutPage;