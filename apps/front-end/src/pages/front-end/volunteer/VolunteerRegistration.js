import Form from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import {
  FrontEndTypo,
  IconByName,
  Layout,
  facilitatorRegistryService,
  getOptions,
  login,
  removeOnboardingMobile,
  removeOnboardingURLData,
  sendAndVerifyOtp,
  volunteerRegistryService,
} from "@shiksha/common-lib";
import Clipboard from "component/Clipboard.js";
import moment from "moment";
import { Box, HStack, Modal, VStack } from "native-base";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useScreenshot } from "use-screenshot-hook";
import ChooseLanguage from "v2/components/Functional/ChooseLanguage/ChooseLanguage";
import LogoScreen from "v2/components/Static/LogoScreen/LogoScreen";
import PageLayout from "v2/components/Static/PageLayout/PageLayout";
import {
  templates,
  widgets,
  onError,
  transformErrors,
} from "../../../component/BaseInput";
import schema1 from "./registration/schema";
import PropTypes from "prop-types";

// App
export default function App({ facilitator, ip, onClick }) {
  const [page, setPage] = useState("logoScreen");
  const [pages, setPages] = useState();
  const [schema, setSchema] = useState({});
  const [credentials, setCredentials] = useState();
  const [submitBtn, setSubmitBtn] = useState();
  const formRef = React.useRef();
  const [formData, setFormData] = useState(facilitator);
  const [errors, setErrors] = useState({});
  const [yearsRange, setYearsRange] = useState([1980, 2030]);
  const [lang, setLang] = useState(localStorage.getItem("lang"));
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const onPressBackButton = async () => {
    const data = await nextPreviewStep("p");
    if (data && onClick) {
      onClick("SplashScreen");
    }
  };
  const ref = React.createRef(null);
  const { image, takeScreenshot } = useScreenshot();
  const getImage = () => takeScreenshot({ ref });
  const downloadImage = () => {
    const FileSaver = require("file-saver");
    FileSaver.saveAs(`${image}`, "image.png");
  };

  useEffect(() => {
    const init = () => {
      if (page && credentials) {
        getImage();
      }
    };
    init();
  }, [page, credentials, getImage]);

  const uiSchema = {
    dob: {
      "ui:widget": "alt-date",
      "ui:options": {
        yearsRange: yearsRange,
        hideNowButton: true,
        hideClearButton: true,
        format: "DMY",
      },
    },
  };

  const nextPreviewStep = async (pageStape = "n") => {
    const index = pages.indexOf(page);
    const properties = schema1.properties;
    if (index !== undefined) {
      let nextIndex = "";
      if (pageStape.toLowerCase() === "n") {
        nextIndex = pages[index + 1];
      } else {
        nextIndex = pages[index - 1];
      }
      if (nextIndex !== undefined) {
        setPage(nextIndex);
        setSchema(properties[nextIndex]);
      } else {
        return true;
      }
    }
  };
  const setStep = async (pageNumber = "") => {
    if (schema1.type === "step") {
      const properties = schema1.properties;
      if (pageNumber !== "") {
        if (page !== pageNumber) {
          setPage(pageNumber);
          setSchema(properties[pageNumber]);
        }
      } else {
        nextPreviewStep();
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      if (schema?.properties?.qualification) {
        setLoading(true);
        const qData = await facilitatorRegistryService.getQualificationAll();
        let newSchema = schema;
        if (schema["properties"]["qualification"]) {
          newSchema = getOptions(newSchema, {
            key: "qualification",
            arr: qData,
            title: "name",
            value: "name",
            filters: { type: "qualification" },
          });
        }
        setSchema(newSchema);
        setLoading(false);
      }

      if (schema?.properties?.state) {
        setLoading(true);
        const { data } = await volunteerRegistryService.getStatesData();
        let newSchema = schema;
        if (schema["properties"]["state"]) {
          newSchema = getOptions(newSchema, {
            key: "state",
            arr: data,
          });
        }
        setSchema(newSchema);
        setLoading(false);
      }
    };
    init();
  }, [page]);

  const setFormInfo = () => {
    if (schema1.type === "step") {
      const properties = schema1.properties;
      const newSteps = Object.keys(properties);
      setPage(newSteps[0]);
      setSchema(properties[newSteps[0]]);
      setPages(newSteps);
      let minYear = moment().subtract("years", 50);
      let maxYear = moment().subtract("years", 18);
      setYearsRange([minYear.year(), maxYear.year()]);
      setSubmitBtn(t("NEXT"));
    }
    setFormData({});
  };

  useEffect(() => {
    const init = () => {
      if (page === "logoScreen") {
        //wait for 1 second
        const delay = 750; // 1 second in milliseconds
        setTimeout(async () => {
          setPage("chooseLangauge");
        }, delay);
      }
    };
    init();
  }, [page]);

  const goErrorPage = (key) => {
    if (key) {
      for (const e of pages) {
        const data = schema1["properties"][e]["properties"][key];
        if (data) {
          setStep(e);
        }
      }
    }
  };

  const validateFn = (data, key) => {
    let error = {};
    switch (key) {
      case "dob": {
        const years = moment().diff(data?.dob, "years");
        if (years < 18) {
          error = { dob: t("MINIMUM_AGE_18_YEAR_OLD") };
        }
        break;
      }
      case "mobile":
        if (data?.mobile?.toString()?.length !== 10) {
          error = { mobile: t("MINIMUM_LENGTH_IS_10") };
        }
        if (!(data?.mobile > 6000000000 && data?.mobile < 9999999999)) {
          error = { mobile: t("PLEASE_ENTER_VALID_NUMBER") };
        }
        break;
      default:
        break;
    }
    return error;
  };

  const customValidate = (data, err) => {
    const arr = Object.keys(err);
    for (const key of arr) {
      const isValidKey = validateFn(data, key);
      if (isValidKey?.[key]) {
        if (!errors?.[key]?.__errors.includes(isValidKey[key]))
          err?.[key]?.addError(isValidKey[key]);
      }
    }
    return err;
  };

  const checkMobileNumberExist = async (mobile) => {
    const response = await volunteerRegistryService.isUserExist({ mobile });
    if (response?.data) {
      const response_isUserExist = response?.data?.user_roles || [];
      if (response_isUserExist?.length > 0) {
        const newErrors = {
          mobile: {
            __errors: [t("MOBILE_NUMBER_ALREADY_EXISTS")],
          },
        };
        setErrors(newErrors);
      }
    }
    return false;
  };

  const onChange = async (e, id) => {
    const data = e.formData;
    setErrors();
    // update setFormData onchange
    const newData = { ...formData, ...data };
    setFormData(newData);
    if (id === "root_pincode") {
      const regex = /^\d{6}$/;
      if (data?.pincode && !regex.test(data.pincode)) {
        const newErrors = {
          pincode: {
            __errors: [t("PINCODE_ERROR")],
          },
        };
        setErrors(newErrors);
      }
    }
    if (id === "root_otp") {
      if (errors?.otp) {
        const newErrors = {};
        setErrors(newErrors);
      }
    }
    if (id === "root_mobile") {
      let { mobile, otp, ...otherError } = errors || {};
      setErrors(otherError);
      if (data?.mobile?.toString()?.length === 10) {
        await checkMobileNumberExist(data?.mobile);
      }
      if (schema?.properties?.otp) {
        const { otp, ...properties } = schema?.properties || {};
        const required = schema?.required.filter((item) => item !== "otp");
        setSchema({ ...schema, properties, required });
      }
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    let updatedFormData = data.formData;
    if (schema?.properties?.first_name) {
      updatedFormData = {
        ...updatedFormData,
        ["first_name"]: updatedFormData?.first_name?.replaceAll(" ", ""),
      };
    }
    if (schema?.properties?.last_name && updatedFormData?.last_name) {
      updatedFormData = {
        ...updatedFormData,
        ["last_name"]: updatedFormData?.last_name?.replaceAll(" ", ""),
      };
    }
    const newData = {
      ...formData,
      ...updatedFormData,
    };
    setFormData(newData);

    if (_.isEmpty(errors) || errors?.otp) {
      const { id } = {};
      let success = false;
      if (id) {
        success = true;
      } else if (page === "4") {
        const resultCheck = await checkMobileNumberExist(
          updatedFormData?.mobile,
        );
        if (!resultCheck) {
          if (!schema?.properties?.otp) {
            const allData = { ...updatedFormData };
            const otherError = { ...errors };

            // Remove the `otp` key if it exists
            delete allData.otp;
            delete otherError.otp;

            // Optionally, remove 'mobile' from otherError if necessary
            delete otherError.mobile;

            setFormData(allData);
            updatedFormData = allData;
            setErrors(otherError);
          }

          const { status, newSchema } = await sendAndVerifyOtp(schema, {
            ...updatedFormData,
            hash: localStorage.getItem("hash"),
          });
          if (status === true) {
            const { data, success } = await formSubmitCreate();
            if (!success) {
              const newErrors = {
                mobile: {
                  __errors:
                    data?.message?.constructor?.name === "String"
                      ? [data?.message]
                      : data?.error?.constructor?.name === "Array"
                        ? data?.error
                        : [t("MOBILE_NUMBER_ALREADY_EXISTS")],
                },
              };
              setErrors(newErrors);
            } else if (data?.username && data?.password) {
              await removeOnboardingURLData();
              await removeOnboardingMobile();
              setCredentials(data);
            }
          } else if (status === false) {
            const newErrors = {
              otp: {
                __errors: [t("USER_ENTER_VALID_OTP")],
              },
            };
            setErrors(newErrors);
          } else {
            setSchema(newSchema);
          }
        }
      } else if (page <= 1) {
        success = true;
      } else {
        success = true;
      }
      if (success) {
        setStep();
      }
    } else {
      const key = Object.keys(errors);
      if (key[0]) {
        goErrorPage(key[0]);
      }
    }
    setLoading(false);
  };

  const formSubmitCreate = async () => {
    return await volunteerRegistryService.create(formData);
  };

  const changeLanguage = () => {
    setFormInfo();
  };

  if (page == "logoScreen") {
    return (
      <PageLayout t={t} isPageMiddle={true} customComponent={<LogoScreen />} />
    );
  } else if (page == "chooseLangauge") {
    return (
      <Layout isCenter _center={{ alignItems: "normal" }}>
        <ChooseLanguage t={t} languageChanged={changeLanguage} />
      </Layout>
    );
  }

  return (
    <Layout
      _appBar={{
        onPressBackButton,
        name: `${ip?.name}`.trim(),
        lang,
        setLang,
        _box: { bg: "white", shadow: "appBarShadow" },
        onlyIconsShow: ["langAppBtn"],
        funLangChange: () => {
          setPage("chooseLangauge");
        },
      }}
      _page={{ _scollView: { bg: "formBg.500" } }}
    >
      <Box py={6} px={4} mb={5}>
        {page && page !== "" && (
          <Form
            key={lang + page}
            ref={formRef}
            extraErrors={errors}
            showErrorList={false}
            noHtml5Validate={true}
            {...{
              widgets,
              templates,
              validator,
              schema: schema || {},
              uiSchema,
              formData,
              customValidate,
              onChange,
              onError,
              onSubmit,
              transformErrors: (errors) => transformErrors(errors, schema, t),
            }}
          >
            {page === "4" ? (
              <FrontEndTypo.Primarybutton
                mt="3"
                variant={"primary"}
                type="submit"
                onPress={(e) => {
                  formRef?.current?.submit();
                }}
              >
                {schema?.properties?.otp ? t("VERIFY_OTP") : t("SEND_OTP")}
              </FrontEndTypo.Primarybutton>
            ) : (
              <FrontEndTypo.Primarybutton
                isLoading={loading}
                type="submit"
                p="4"
                mt="10"
                onPress={(e) => {
                  formRef?.current?.submit();
                }}
              >
                {pages[pages?.length - 1] === page ? t("SUBMIT") : submitBtn}
              </FrontEndTypo.Primarybutton>
            )}
          </Form>
        )}
      </Box>
      <Modal
        isOpen={credentials}
        safeAreaTop={true}
        size="xl"
        _backdrop={{ opacity: "0.7" }}
      >
        <Modal.Content>
          <Modal.Header p="5" borderBottomWidth="0">
            <FrontEndTypo.H1 textAlign="center">
              {t("STORE_YOUR_CREDENTIALS")}
            </FrontEndTypo.H1>
          </Modal.Header>
          <Modal.Body p="5" pb="10">
            <VStack space="5">
              <VStack
                space="2"
                bg="gray.100"
                p="1"
                rounded="lg"
                borderWidth={1}
                borderColor="gray.300"
                w="100%"
              >
                <HStack alignItems="center" space="1" flex="1">
                  <FrontEndTypo.H3 flex="0.3">{t("USERNAME")}</FrontEndTypo.H3>
                  <FrontEndTypo.H4
                    py="1"
                    px="2"
                    flex="0.7"
                    wordWrap="break-word"
                    whiteSpace="break-spaces"
                    overflow="hidden"
                    bg="success.100"
                    borderWidth="1"
                    borderColor="success.500"
                  >
                    {credentials?.username}
                  </FrontEndTypo.H4>
                </HStack>
                <HStack alignItems="center" space="1" flex="1">
                  <FrontEndTypo.H3 flex="0.3">{t("PASSWORD")}</FrontEndTypo.H3>
                  <FrontEndTypo.H4
                    py="1"
                    px="2"
                    flex="0.7"
                    wordWrap="break-word"
                    whiteSpace="break-spaces"
                    overflow="hidden"
                    bg="success.100"
                    borderWidth="1"
                    borderColor="success.500"
                  >
                    {credentials?.password}
                  </FrontEndTypo.H4>
                </HStack>
              </VStack>
              <VStack alignItems="center">
                <Clipboard
                  text={`username: ${credentials?.username}, password: ${credentials?.password}`}
                  onPress={(e) => {
                    setCredentials({ ...credentials, copy: true });
                    downloadImage();
                  }}
                >
                  <HStack space="3">
                    <IconByName
                      name="FileCopyLineIcon"
                      isDisabled
                      rounded="full"
                      color="blue.300"
                    />
                    <FrontEndTypo.H3 color="blue.300">
                      {t("CLICK_HERE_TO_COPY_AND_LOGIN")}
                    </FrontEndTypo.H3>
                  </HStack>
                </Clipboard>
              </VStack>
              <HStack space="5" pt="5">
                <FrontEndTypo.Primarybutton
                  flex={1}
                  isDisabled={!credentials?.copy}
                  onPress={async (e) => {
                    const { copy, ...cData } = credentials;
                    await login(cData);
                    navigate("/");
                    navigate(0);
                  }}
                >
                  {t("LOGIN")}
                </FrontEndTypo.Primarybutton>
              </HStack>
            </VStack>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </Layout>
  );
}

App.propTypes = {
  facilitator: PropTypes.object,
  ip: PropTypes.any,
  onClick: PropTypes.func,
};
