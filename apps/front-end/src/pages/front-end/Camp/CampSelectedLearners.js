import React, { useEffect } from "react";
import {
  Alert,
  Box,
  Checkbox,
  HStack,
  Pressable,
  VStack,
  Modal,
} from "native-base";
import {
  Layout,
  FrontEndTypo,
  IconByName,
  ImageView,
  campService,
  CardComponent,
} from "@shiksha/common-lib";
import { useNavigate, useParams } from "react-router-dom";

import { useTranslation } from "react-i18next";
import Chip, { ChipStatus } from "component/BeneficiaryStatus";

// App
export default function CampSelectedLearners() {
  const [loading, setLoading] = React.useState(true);
  const [alert, setAlert] = React.useState(false);
  const camp_id = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [users, setUsers] = React.useState([]);
  const [selectedIds, setSelectedIds] = React.useState([]);
  const [isDisable, setIsDisable] = React.useState(false);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [canSelectUsers, setCanSelectUsers] = React.useState([]);
  const [selectAllChecked, setSelectAllChecked] = React.useState(false);

  const onPressBackButton = async () => {
    navigate(`/camps/${camp_id?.id}`);
  };

  const handleCheckboxChange = (id) => {
    setSelectedIds((prevSelectedIds) => {
      if (prevSelectedIds.includes(id)) {
        return prevSelectedIds.filter((selectedId) => selectedId !== id);
      } else {
        return [...prevSelectedIds, id];
      }
    });
  };

  const handleSelectAllChange = (e) => {
    setSelectAllChecked(e);
    if (!e) {
      setSelectedIds([]);
    } else {
      const newSelectedIds = users
        ?.filter((item) => !canSelectUsers.some((user) => user.id === item.id))
        .map((item) => item.id);
      setSelectedIds(newSelectedIds);
    }
  };
  const updateLearner = async () => {
    setIsDisable(true);
    if (selectedIds?.length !== 0) {
      setIsDisable(true);
      const updateLearner = {
        learner_ids: selectedIds,
        edit_page_type: "edit_learners",
        id: camp_id?.id,
      };

      const data = await campService.updateCampDetails(updateLearner);
      if (data) {
        navigate(`/camps/${camp_id?.id}`);
      }
    } else {
      setIsDisable(false);
      setAlert(true);
    }
  };

  React.useEffect(async () => {
    const result = await campService.campNonRegisteredUser();
    const campdetails = await campService.getCampDetails(camp_id);
    let users = [];
    if (
      ["registered", "camp_ip_verified"].includes(
        campdetails?.data?.group?.status,
      )
    ) {
      users = campdetails?.data?.group_users || [];
      setCanSelectUsers(users);
    }
    const resultNonR = result?.data?.user || [];
    const mergedData = campdetails?.data?.group_users?.concat(resultNonR);
    setUsers(mergedData);
    const ids = campdetails?.data?.group_users?.map((item) => item.id);
    setSelectedIds(ids);
    setLoading(false);
  }, []);

  useEffect(() => {
    const init = () => {
      setSelectAllChecked(selectedIds?.length === users.length);
    };
    init();
  }, [selectedIds, users]);

  return (
    <Layout
      loading={loading}
      _page={{ _scollView: { bg: "bgGreyColor.200" } }}
      _appBar={{
        name: t("LEARNERS_IN_CAMP"),
        onPressBackButton,
        _box: { bg: "white" },
      }}
      analyticsPageTitle={"CAMP_SELECT_LREARNER"}
      pageTitle={t("CAMP")}
      stepTitle={t("LEARNERS_IN_CAMP")}
    >
      <VStack p={4} space={4}>
        {alert && (
          <FrontEndTypo.H3 color={"textMaroonColor.400"}>
            <Alert status="warning" alignItems={"start"} width={"100%"}>
              <HStack alignItems="center" space="2" color>
                <Alert.Icon />
                <FrontEndTypo.H3>{t("SELECT_LEARNER")}</FrontEndTypo.H3>
              </HStack>
            </Alert>
          </FrontEndTypo.H3>
        )}
        <HStack
          space={2}
          paddingRight={2}
          alignItems={"center"}
          justifyContent={"flex-end"}
        >
          {t("SELECT_ALL")}
          <Checkbox
            isChecked={selectAllChecked}
            onChange={handleSelectAllChange}
            colorScheme="danger"
          />
        </HStack>
        <VStack space={4}>
          {users?.map((item) => {
            return (
              <CardComponent
                _header={{ bg: "white" }}
                _vstack={{
                  bg: "white",
                  m: "0",
                }}
                _body={{ pb: 3, px: 3, pt: 3 }}
                key={item}
              >
                <HStack
                  space={1}
                  rounded="sm"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <HStack alignItems="center" flex="1">
                    <Pressable onPress={() => setModalVisible(item)}>
                      {item?.profile_photo_1?.id ? (
                        <ImageView
                          source={{
                            uri: item?.profile_photo_1?.name,
                          }}
                          width="50px"
                          height="50px"
                        />
                      ) : (
                        <IconByName
                          isDisabled
                          name="AccountCircleLineIcon"
                          color="gray.300"
                          _icon={{ size: "60px" }}
                        />
                      )}
                    </Pressable>

                    {/* Text content */}
                    <VStack pl="2" flex="1">
                      <HStack>
                        <Chip py="2px" px="2" m="0">
                          <FrontEndTypo.H4
                            color="floatingLabelColor.500"
                            fontWeight={"600"}
                          >
                            {item?.id}
                          </FrontEndTypo.H4>
                        </Chip>
                      </HStack>
                      <FrontEndTypo.H3 bold color="textGreyColor.800">
                        {[
                          item?.program_beneficiaries[0]?.enrollment_first_name,
                          item?.program_beneficiaries[0]
                            ?.enrollment_middle_name,
                          item?.program_beneficiaries[0]?.enrollment_last_name,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      </FrontEndTypo.H3>

                      <FrontEndTypo.H4>
                        {[item?.district, item?.block, item?.village]
                          .filter(Boolean)
                          .join(" ")}
                        {/* Repeated block removed */}
                      </FrontEndTypo.H4>
                    </VStack>
                  </HStack>

                  <Box maxW="121px">
                    {!canSelectUsers.find((e) => e?.id === item?.id)?.id && (
                      <Checkbox
                        isChecked={selectedIds.includes(item.id)}
                        onChange={() => handleCheckboxChange(item.id)}
                        colorScheme="danger"
                      />
                    )}
                  </Box>
                </HStack>
              </CardComponent>
            );
          })}
        </VStack>
        <FrontEndTypo.Primarybutton
          isDisabled={isDisable}
          onPress={updateLearner}
        >
          {t("SAVE_AND_CAMP_PROFILE")}
        </FrontEndTypo.Primarybutton>
      </VStack>
      <Modal isOpen={modalVisible} avoidKeyboard size="xl">
        <Modal.Content>
          <Modal.Header textAlign={"Center"}>{t("PROFILE")}</Modal.Header>
          <Modal.Body>
            <VStack alignItems={"center"}>
              {modalVisible?.profile_photo_1?.id ? (
                <ImageView
                  source={{
                    uri: modalVisible?.profile_photo_1?.name,
                  }}
                  // alt="Alternate Text"
                  width={"60px"}
                  height={"60px"}
                />
              ) : (
                <IconByName
                  isDisabled
                  name="AccountCircleLineIcon"
                  color="gray.300"
                  _icon={{ size: "60px" }}
                />
              )}

              <FrontEndTypo.H3 bold color="textGreyColor.800">
                {
                  modalVisible?.program_beneficiaries?.[0]
                    ?.enrollment_first_name
                }
                {modalVisible?.program_beneficiaries?.[0]
                  ?.enrollment_middle_name &&
                  ` ${modalVisible?.program_beneficiaries?.[0]?.enrollment_middle_name}`}
                {modalVisible?.program_beneficiaries?.[0]
                  ?.enrollment_last_name &&
                  ` ${modalVisible?.program_beneficiaries?.[0]?.enrollment_last_name}`}
              </FrontEndTypo.H3>
              <Chip>{modalVisible?.id}</Chip>
              <ChipStatus
                is_duplicate={
                  modalVisible?.program_beneficiaries?.[0]?.is_duplicate
                }
                is_deactivated={
                  modalVisible?.program_beneficiaries?.[0]?.is_deactivated
                }
                status={modalVisible?.program_beneficiaries?.[0]?.status}
                rounded={"sm"}
              />
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <HStack
              // height={"80%"}
              justifyContent={"space-between"}
              width={"100%"}
            >
              <FrontEndTypo.Secondarybutton
                onPress={() => setModalVisible(false)}
              >
                {t("CANCEL")}
              </FrontEndTypo.Secondarybutton>
              <FrontEndTypo.Primarybutton
                onPress={() => navigate(`/beneficiary/${modalVisible?.id}`)}
              >
                {t("VIEW_PROFILE")}
              </FrontEndTypo.Primarybutton>
            </HStack>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </Layout>
  );
}
