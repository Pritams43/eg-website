import React, { useEffect, useRef, useState } from "react";
import Form from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import {
  BodyMedium,
  CardComponent,
  filterObject,
  FrontEndTypo,
  getOptions,
  IconByName,
  validation,
} from "@shiksha/common-lib";
import { Alert, Box, Button, HStack, Radio, VStack } from "native-base";
import { useTranslation } from "react-i18next";
import {
  getOnboardingData,
  updateOnboardingData,
} from "v2/utils/OfflineHelper/OfflineHelper.js";
import {
  templates,
  widgets,
} from "../../Static/FormBaseInput/FormBaseInput.js";
import schema1 from "./arraySchema.js";
import PropTypes from "prop-types";

// App
export default function PrerakOnboardingArrayForm({
  userTokenInfo,
  userid,
  type,
  navigatePage,
}) {
  const [schema, setSchema] = useState({});
  const formRef = useRef();
  const [formData, setFormData] = useState();
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState();
  const [lang, setLang] = useState(localStorage.getItem("lang"));
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const [dataExperience, setDataExperience] = useState([]);
  const [data, setData] = useState([]);
  const [facilitator, setFacilitator] = useState();
  const [addMore, setAddMore] = useState();
  const [keys, setKeys] = useState([]);
  const [labels, setLabels] = useState([]);

  useEffect(() => {
    setLang(localStorage.getItem("lang"));
  }, [localStorage.getItem("lang")]);

  const stepLabel =
    type === "reference_details"
      ? "REFERENCE_DETAILS"
      : type === "experience"
        ? "WORK_DETAILS"
        : "ADD_VOLUNTEER_EXPERIENCE";
  const stepLabelList =
    type === "reference_details"
      ? "3_REFERENCE_DETAILS"
      : type === "experience"
        ? "WORK_DETAILS"
        : "2_VOLUNTEER_AND_WORK_DETAILS";

  const stepLabelListTwo =
    type === "experience"
      ? "DO_YOU_HAVE_ANY_JOB_EXPERIENCE"
      : "DO_YOU_HAVE_ANY_VOLUNTEER_EXPERIENCE";

  const stepLabelLinks =
    type === "reference_details"
      ? "REFERENCE_DETAILS"
      : type === "experience"
        ? "ADD_ANOTHER_JOB_EXPERIENCE"
        : "ADD_ANOTHER_VOLUNTEER_EXPERIENCE";

  const stepTitle = type === "experience" ? "JOB_TITLE" : "VOLUNTEER_TITLE";
  const nextPreviewStep = async (p = "n") => {
    setAlert();
    if (addMore) {
      setAddMore();
    } else if (p === "p") {
      navigatePage("/profile", "");
    } else if (type === "reference_details") {
      navigatePage(
        `/profile/edit/work_availability_details`,
        "work_availability_details",
      );
    } else if (type === "vo_experience") {
      navigatePage(`/profile/edit/experience`, "experience");
    } else {
      navigatePage(
        `/profile/edit/qualification_details`,
        "qualification_details",
      );
    }
  };
  useEffect(() => {
    if (facilitator) {
      if (type == "experience") {
        setData(dataExperience);
      }
    }
  }, [facilitator]);

  useEffect(async () => {
    const id = userid;
    if (schema1.type === "step") {
      const properties = schema1.properties;
      let newSchema1 =
        properties[
          ["vo_experience", "experience"].includes(type) ? "experience" : type
        ];
      if (newSchema1) {
        let newSchema = newSchema1;
        if (
          newSchema["properties"]?.["reference_details"]?.["properties"]?.[
            "document_id"
          ]
        ) {
          newSchema = getOptions(newSchema, {
            key: "reference_details",
            extra: getOptions(newSchema["properties"]?.["reference_details"], {
              key: "document_id",
              extra: {
                userId: id,
              },
            }),
          });
        }

        if (newSchema["properties"]?.["role_title"]) {
          newSchema = getOptions(newSchema, {
            key: "role_title",
            extra: { title: stepTitle },
          });
        }
        if (stepLabel === "ADD_VOLUNTEER_EXPERIENCE") {
          const {
            role_title,
            organization,
            description,
            experience_in_years,
            related_to_teaching,
          } = newSchema?.properties || {};

          const updatedSchema = {
            ...newSchema,
            properties: {
              role_title,
              organization,
              description,
              experience_in_years,
              related_to_teaching,
            },
            required: [
              "role_title",
              "organization",
              "experience_in_years",
              "related_to_teaching",
            ],
            title: stepLabelList,
            description: stepLabel,
          };
          setSchema(updatedSchema);
        } else {
          setSchema({ ...newSchema, title: stepLabel });
        }

        const refPro =
          newSchema?.properties["reference_details"]?.["properties"];
        let newKeys = Object.keys(newSchema?.properties).filter(
          (e) => e !== "reference_details",
        );

        let newLabels = newKeys.map((e) =>
          newSchema?.properties?.[e]?.label
            ? newSchema?.properties?.[e]?.label
            : newSchema?.properties?.[e]?.title
              ? newSchema?.properties?.[e]?.title
              : "",
        );

        if (refPro) {
          let refKeys = Object.keys(refPro);
          newKeys = [...newKeys, ...refKeys];
          const refLabels = refKeys.map((e) =>
            refPro?.[e]?.label
              ? refPro?.[e]?.label
              : refPro?.[e]?.title
                ? refPro?.[e]?.title
                : "",
          );
          newLabels = [...newLabels, ...refLabels];
        }
        setLabels(newLabels);
        setKeys(newKeys);
      }

      await getData();
      setFormData();
      setAddMore();
    }
  }, [type]);

  const getData = async () => {
    const id = userid;
    if (id) {
      //get online data
      //const result = await facilitatorRegistryService.getOne({ id });

      //get offline data
      setLoading(true);
      const result = await getOnboardingData(id);
      setFacilitator(result);
      if (type === "reference_details") {
        setData(result?.references);
      } else if (type === "vo_experience") {
        setData(result?.vo_experience);
      } else if (type === "experience") {
        setData(result?.experience);
      }
      setDataExperience(result?.experience);
      setLoading(false);
    }
  };

  const customValidate = (item, errors, c) => {
    if (["experience", "vo_experience"].includes(type)) {
      if (schema?.properties?.reference_details?.properties?.contact_number) {
        if (item?.reference_details?.contact_number) {
          const result = validation({
            data: item?.reference_details?.contact_number,
            type: "mobile",
          });
          if (result) {
            errors?.reference_details?.contact_number?.addError(
              `${t("PLEASE_ENTER_VALID_10_DIGIT_NUMBER")}`,
            );
          }
        }
      }
    }
    ["role_title", "organization", "description"].forEach((key) => {
      if (item?.[key]) {
        if (
          // !item?.[key]?.match(/^[a-zA-Z ]*$/g) ||
          item?.[key]?.replace(/\s/g, "") === ""
        ) {
          errors?.[key]?.addError(
            `${t("REQUIRED_MESSAGE")} ${t(schema?.properties?.[key]?.title)}`,
          );
        } else if (key === "description" && item?.[key].length > 200) {
          errors?.[key]?.addError(
            `${t("MAX_LENGHT_200")} ${t(schema?.properties?.[key]?.title)}`,
          );
        }
      }
    });
    return errors;
  };

  const transformErrors = (errors, uiSchema) => {
    return errors.map((error) => {
      if (error.name === "required") {
        if (schema?.properties?.[error?.property]?.title) {
          error.message = `${t("REQUIRED_MESSAGE")} "${t(
            schema?.properties?.[error?.property]?.title,
          )}"`;
        } else {
          error.message = `${t("REQUIRED_MESSAGE")}`;
        }
      } else if (error.name === "enum") {
        error.message = `${t("SELECT_MESSAGE")}`;
      } else if (["format", "type"].includes(error.name)) {
        let message = "REQUIRED_MESSAGE";
        if (["format", "type"].includes("email")) {
          message = "PLEASE_ENTER_VALID_EMAIL";
        } else if (["format", "type"].includes("string")) {
          message = "PLEASE_ENTER_VALID_STREING";
        } else if (["format", "type"].includes("number")) {
          message = "PLEASE_ENTER_VALID_NUMBER";
        }

        if (schema?.properties?.[error?.property]?.title) {
          error.message = `${t(message)} "${t(
            schema?.properties?.[error?.property]?.title,
          )}"`;
        } else {
          error.message = `${t(message)}`;
        }
      }
      return error;
    });
  };

  const onChange = async (e, id) => {
    const data = e.formData;
    const user = userTokenInfo?.authUser;
    if (id === "root_reference_details_contact_number") {
      if (data?.reference_details?.contact_number?.toString().length === 10) {
        if (data?.reference_details?.contact_number === facilitator?.mobile) {
          const newErrors = {
            reference_details: {
              contact_number: {
                __errors: [t("ERROR_MESSAGE_MOBILE_NUMBER_CANNT_USE")],
              },
            },
          };
          setErrors(newErrors);
        } else {
          setErrors();
        }
      }
    }

    if (id === "root_reference_details_type_of_document") {
      let newSchema = schema;
      setLoading(true);
      if (
        newSchema["properties"]?.["reference_details"]?.["properties"]?.[
          "document_id"
        ]
      ) {
        newSchema = getOptions(newSchema, {
          key: "reference_details",
          extra: getOptions(newSchema["properties"]?.["reference_details"], {
            key: "document_id",
            extra: {
              userId: user.id,
              document_type: data?.reference_details?.type_of_document,
            },
          }),
        });
      }
      setLoading(false);
      setSchema(newSchema);
    }

    const newData = { ...formData, ...data };
    setFormData(newData);
  };

  const onSubmit = async (data) => {
    let newFormData = data.formData;
    if (_.isEmpty(errors)) {
      const newdata = filterObject(newFormData, [
        ...Object.keys(schema?.properties),
        "arr_id",
        "status",
        "unique_key",
      ]);
      //offline data submit
      await updateOnboardingData(userid, {
        ...newdata,
        ...(type === "vo_experience"
          ? { has_volunteer_exp: true }
          : { has_job_exp: true }),
        type,
      });
      //get offline data
      setLoading(true);
      const result = await getOnboardingData(userid);
      setFacilitator(result);
      if (type === "reference_details") {
        setData(result?.references);
      } else if (type === "vo_experience") {
        setData(result?.vo_experience);
      } else if (type === "experience") {
        setData(result?.experience);
      }
      setDataExperience(result?.experience);
      setLoading(false);
      setAddMore(false);
    }
  };

  const onAdd = () => {
    setFormData({
      status: "insert",
    });
    setAddMore(true);
  };

  const onEdit = (item) => {
    setFormData({
      ...item,
      reference_details: item?.reference ? item?.reference : {},
      arr_id: item?.id,
      status: "update",
    });
    setAddMore(true);
  };

  const onClickSubmit = (bool) => {
    if (!bool) {
      nextPreviewStep();
    } else {
      navigatePage("/profile", "");
    }
  };
  const onClickAdd = (value) => {
    if (value) {
      onAdd();
    }
  };
  const displayQuation =
    type === "vo_experience" ? data?.length == 0 : dataExperience?.length == 0;
  return (
    <>
      {["quit"].includes(facilitator?.status) ? (
        <Alert status="warning" alignItems={"start"} mb="3" mt="4">
          <HStack alignItems="center" space="2" color>
            <Alert.Icon />
            <BodyMedium>{t("PAGE_NOT_ACCESSABLE")}</BodyMedium>
          </HStack>
        </Alert>
      ) : (
        <Box py={6} px={4} mb={5}>
          {!addMore ? (
            <VStack space={"4"}>
              <FrontEndTypo.H1
                color="textGreyColor.900"
                lineHeight="30px"
                fontWeight="600"
              >
                {`${t(stepLabelList)}`}
              </FrontEndTypo.H1>
              {displayQuation && (
                <VStack space={2}>
                  <FrontEndTypo.H3
                    color="textGreyColor.750"
                    lineHeight="21px"
                    fontWeight="600"
                  >
                    {`${t(stepLabelListTwo)}`}
                  </FrontEndTypo.H3>
                  <Radio.Group
                    name="radioOptions"
                    value={!displayQuation}
                    onChange={(nextValue) => onClickAdd(nextValue)}
                    flexDirection="row"
                  >
                    <Radio value={true} my={1}>
                      {t("YES")}
                    </Radio>
                    <Radio value={false} my={1} ml={4}>
                      {t("NO")}
                    </Radio>
                  </Radio.Group>
                </VStack>
              )}

              {type == "vo_experience"
                ? data &&
                  data.constructor.name === "Array" &&
                  data?.map((item, index) => {
                    const {
                      name,
                      contact_number,
                      type_of_document,
                      document_id,
                    } = item?.reference || {};

                    return item?.status == "delete" ? (
                      <></>
                    ) : (
                      <Box key={name}>
                        <CardComponent
                          schema={schema}
                          index={index + 1}
                          item={{
                            ...item,
                            ...(item?.reference?.constructor.name === "Object"
                              ? {
                                  name,
                                  contact_number,
                                  type_of_document,
                                  document_id,
                                }
                              : {}),
                          }}
                          onEdit={(e) => onEdit(e)}
                          arr={[
                            "role_title",
                            "organization",
                            "description",
                            "experience_in_years",
                            "related_to_teaching",
                          ]}
                          label={labels}
                          title={`${t("VOLUNTEER_EXPERIENCE")} ${index + 1}`}
                        />
                      </Box>
                    );
                  })
                : dataExperience &&
                  dataExperience.constructor.name === "Array" &&
                  dataExperience?.map((item, index) => {
                    const {
                      name,
                      contact_number,
                      type_of_document,
                      document_id,
                    } = item?.reference || {};

                    return item?.status == "delete" ? (
                      <></>
                    ) : (
                      <Box key={name}>
                        <CardComponent
                          schema={schema}
                          index={index + 1}
                          item={{
                            ...item,
                            ...(item?.reference?.constructor.name === "Object"
                              ? {
                                  name,
                                  contact_number,
                                  type_of_document,
                                  document_id,
                                }
                              : {}),
                          }}
                          onEdit={(e) => onEdit(e)}
                          arr={keys}
                          label={labels}
                          title={`${t("WORK_EXPERIENCE")} ${index + 1}`}
                        />
                      </Box>
                    );
                  })}
              {!displayQuation && (
                <Button variant={"link"} colorScheme="info" onPress={onAdd}>
                  <FrontEndTypo.H5
                    color="blueText.500"
                    underline
                    bold
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    <IconByName
                      name="AddLineIcon"
                      _icon={{ size: "16px" }}
                      style={{ fontSize: "8px", marginRight: "4px" }}
                    />
                    {`${t(stepLabelLinks)}`}
                  </FrontEndTypo.H5>
                </Button>
              )}
              <Box alignItems={"center"}>
                <FrontEndTypo.Primarybutton
                  isLoading={loading}
                  p="4"
                  mt="4"
                  minWidth="60%"
                  onPress={() => onClickSubmit(false)}
                >
                  {t("PRERAK_PROCEED_BTN")}
                </FrontEndTypo.Primarybutton>

                <FrontEndTypo.Secondarybutton
                  isLoading={loading}
                  p="4"
                  mt="4"
                  minWidth="60%"
                  onPress={() => onClickSubmit(true)}
                >
                  {t("GO_TO_PROFILE")}
                </FrontEndTypo.Secondarybutton>
              </Box>
            </VStack>
          ) : (
            <Box>
              {alert && (
                <Alert status="warning" alignItems={"start"} mb="3">
                  <HStack alignItems="center" space="2" color>
                    <Alert.Icon />
                    <BodyMedium>{alert}</BodyMedium>
                  </HStack>
                </Alert>
              )}
              <Form
                key={lang}
                ref={formRef}
                extraErrors={errors}
                showErrorList={false}
                noHtml5Validate={true}
                {...{
                  widgets,
                  templates,
                  validator,
                  schema: schema || {},
                  formData,
                  customValidate,
                  onChange,
                  onSubmit,
                  transformErrors,
                }}
              >
                <FrontEndTypo.Primarybutton
                  isLoading={loading}
                  p="4"
                  mt="4"
                  onPress={() => {
                    if (formRef.current.validateForm()) {
                      formRef?.current?.submit();
                    }
                  }}
                >
                  {t("SAVE")}
                </FrontEndTypo.Primarybutton>
                <FrontEndTypo.Secondarybutton
                  isLoading={loading}
                  p="4"
                  mt="4"
                  onPress={() => setAddMore()}
                >
                  {t("CANCEL")}
                </FrontEndTypo.Secondarybutton>
              </Form>
            </Box>
          )}
        </Box>
      )}
    </>
  );
}

PrerakOnboardingArrayForm.propTypes = {
  userTokenInfo: PropTypes.any,
  userid: PropTypes.any,
  type: PropTypes.any,
  navigatePage: PropTypes.any,
};
