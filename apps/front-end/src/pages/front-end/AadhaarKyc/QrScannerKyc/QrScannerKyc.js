import React, { useEffect, useState, useRef } from "react";
import {
  useWindowSize,
  IconByName,
  authRegistryService,
  checkAadhaar,
} from "@shiksha/common-lib";
import { Box, VStack, HStack, Center } from "native-base";
import { QrReader } from "react-qr-reader";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";

const App = ({
  setOtpFailedPopup,
  setPage,
  setError,
  id,
  setAttempt,
  setAadhaarCompare,
  user,
}) => {
  const [selected, setSelected] = useState(false);
  const [startScan, setStartScan] = useState(true);
  const [loadingScan, setLoadingScan] = useState(false);
  const { t } = useTranslation();
  const [width, height] = useWindowSize();
  const topElement = useRef(null);
  const bottomElement = useRef(null);
  const [cameraHeight, setCameraHeight] = useState();
  const [cameraWidth, setCameraWidth] = useState();
  const [torch, setTorch] = useState(false);

  const handleScan = async (scanData) => {
    setLoadingScan(true);
    if (scanData && scanData !== "") {
      const result = await authRegistryService.aadhaarQr({
        qr_data: scanData?.text ? scanData?.text : scanData,
      });
      if (result?.error) {
        setError({
          top: t(`QR_CODE_INVALID`),
        });
        setPage();
        setOtpFailedPopup(false);
        setAttempt("addhar-qr");
      } else {
        setError();
        setAttempt("addhar-qr");
        const resultCheck = checkAadhaar(user, result?.data?.aadhaar);
        setAadhaarCompare(resultCheck);
        if (resultCheck?.isVerified) {
          const aadhaarResult = await authRegistryService.aadhaarKyc({
            id,
            aadhar_verified: "yes",
            aadhaar_verification_mode: "qr",
          });
          if (aadhaarResult?.error) {
            setError({
              top: `QR code ${aadhaarResult?.error}`,
            });
            setPage();
            setOtpFailedPopup(false);
          } else {
            setPage("aadhaarSuccess");
            setOtpFailedPopup(false);
            setStartScan(false);
          }
        } else {
          setPage("aadhaarSuccess");
          setStartScan(false);
        }
      }
      setStartScan(false);
      setLoadingScan(false);
    }
  };

  const handleError = (err) => {
    console.error(err, loadingScan);
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      let newHeight =
        height -
        ((topElement?.current?.clientHeight
          ? topElement?.current?.clientHeight
          : 0) +
          (bottomElement?.current?.clientHeight
            ? bottomElement?.current?.clientHeight
            : 0));
      if (isMounted) {
        const w = topElement?.current?.clientWidth;
        const h = newHeight;
        setCameraWidth(w);
        setCameraHeight(h);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  });

  return (
    <Box alignItems={"center"}>
      <Box position="fixed" {...{ width, height }} bg="gray.900">
        <Box p="20px" ref={topElement}>
          <HStack
            space={4}
            justifyContent="space-between"
            flex={1}
            alignItems="center"
          >
            <IconByName
              isDisabled
              color={"gray.900"}
              _icon={{
                size: "0px",
              }}
            />
            <IconByName
              name="CloseCircleLineIcon"
              color={"white"}
              _icon={{
                size: "30px",
              }}
              onPress={(e) => {
                setStartScan(false);
              }}
            />
          </HStack>
        </Box>
        {startScan && (
          <VStack>
            <Center>
              <QrReader
                onLoad={(e) => console.log(e)}
                key={cameraHeight + cameraWidth + selected + torch}
                // facingMode={selected ? "user" : "environment"}
                constraints={{
                  facingMode: selected ? "left" : "environment",
                  mirrorVideo: true,
                  advanced: [{ torch: true }],
                }}
                videoStyle={{
                  height: cameraHeight,
                  width: cameraWidth,
                  display: "flex",
                  alignItems: "center",
                }}
                videoContainerStyle={{
                  height: cameraHeight,
                  width: cameraWidth,
                  padding: "0px",
                }}
                delay={2000}
                onError={handleError}
                onScan={handleScan}
              />
            </Center>
          </VStack>
        )}

        <Box py="30px" px="20px" ref={bottomElement}>
          <HStack
            space={4}
            justifyContent="space-between"
            flex={1}
            alignItems="center"
          >
            {startScan && (
              <IconByName
                name={torch ? "FlashlightFillIcon" : "FlashlightLineIcon"}
                color={"white"}
                _icon={{
                  size: "30px",
                }}
                onPress={(e) => setTorch(!torch)}
              />
            )}
            {startScan && (
              <IconByName
                name={selected ? "CameraLineIcon" : "CameraSwitchLineIcon"}
                color={"white"}
                _icon={{
                  size: "30px",
                }}
                onPress={(e) => setSelected(!selected)}
              />
            )}
          </HStack>
        </Box>
      </Box>
    </Box>
  );
};

export default App;

App.propTypes = {
  setOtpFailedPopup: PropTypes.func,
  setPage: PropTypes.func,
  setError: PropTypes.func,
  id: PropTypes.any,
  setAttempt: PropTypes.func,
  setAadhaarCompare: PropTypes.func,
  user: PropTypes.any,
};
