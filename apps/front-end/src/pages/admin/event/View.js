import {
  AdminTypo,
  Breadcrumb,
  GetEnumValue,
  IconByName,
  AdminLayout as Layout,
  attendanceService,
  enumRegistryService,
  eventService,
  testRegistryService,
  useLocationData,
} from "@shiksha/common-lib";
import Chip from "component/Chip";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { debounce } from "lodash";
import moment from "moment";
import {
  Alert,
  Avatar,
  Badge,
  HStack,
  Input,
  Modal,
  Select,
  Stack,
  Switch,
  Text,
  VStack,
  useToast,
} from "native-base";
import {
  Suspense,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import DataTable from "react-data-table-component";
import { useTranslation } from "react-i18next";
import { useWindowDimensions } from "react-native-web";
import { useNavigate, useParams } from "react-router-dom";
import PropTypes from "prop-types";

const customStyles = {
  headCells: {
    style: {
      background: "#E0E0E0",
      fontSize: "14px",
      color: "#616161",
    },
  },
  cells: {
    style: {
      padding: "10px 5px",
    },
  },
};

const renderNameColumn = (row) => {
  const name = row?.first_name + " " + row?.last_name;
  const hasProfileUrl = !!row?.profile_url;

  return (
    <HStack alignItems={"center"} space="2">
      {hasProfileUrl ? (
        <Avatar
          alignItems={"start"}
          source={{ uri: row?.profile_url }}
          width="30px"
          height="30px"
        />
      ) : (
        <IconByName
          name="AccountCircleLineIcon"
          color="gray.300"
          _icon={{ size: "30" }}
        />
      )}
      <AdminTypo.H7 fontWeight="400">{name}</AdminTypo.H7>
    </HStack>
  );
};
const renderIDColumn = (row) => {
  const ID = row?.id;

  return (
    <HStack alignItems="center" space="2">
      {ID}
    </HStack>
  );
};

const renderStatusColumn = (row) => (
  <Text>{row?.attendances?.[0]?.rsvp || "-"}</Text>
);

const onUpdateOrCreateAttendace = async (row) => {
  try {
    if (row?.event_id) {
      if (row?.attendance?.id) {
        const data = {
          id: row?.attendance?.id,
          user_id: row?.attendance.user_id,
          lat: `${row?.locationData?.latitude || ""}`, //attendance.lat,
          long: `${row?.locationData?.longitude || ""}`, //attendance.long,
          date_time: row?.presentDate,
          status: row?.attendance_status,
        };
        return await eventService.updateAttendance(data);
      } else {
        const data = {
          user_id: row.id,
          context_id: row?.event_id,
          context: "events",
          lat: `${row?.locationData?.latitude || ""}`, //attendance.lat,
          long: `${row?.locationData?.longitude || ""}`, //attendance.long,
          date_time: row?.presentDate,
          status: row?.attendance_status,
        };
        return await attendanceService.createAttendance(data);
      }
    }
  } catch (error) {
    // handle error
    console.error(error?.message || "error");
  }
};

const scheduleCandidates = ({ t, days, certificateDownload, width }) => {
  const data = [
    {
      name: t("ID"),
      selector: (row) => renderIDColumn(row),
      sortable: false,
      attr: "id",
      width: "50px",
      wrap: true,
    },
    {
      name: t("NAME"),
      selector: (row) => renderNameColumn(row),
      sortable: false,
      wrap: true,
      attr: "name",
    },
    {
      name: t("INVITE_STATUS"),
      selector: (row) => renderStatusColumn(row),
      sortable: false,
      attr: "invite",
    },
    ...days,
    {
      name: t("SCORE"),
      selector: (row) => {
        const score = row?.lms_test_trackings?.[0]?.score;
        const roundedScore = typeof score === "number" ? score.toFixed(2) : "-";
        return roundedScore;
      },
      attr: "name",
      wrap: true,
    },

    {
      name: t("STATUS"),
      selector: (row) =>
        row?.lms_test_trackings?.[0]?.certificate_status === true ? (
          <AdminTypo.Secondarybutton
            my="3"
            onPress={() => certificateDownload(row.lms_test_trackings?.[0])}
          >
            {t("DOWNLOAD")}
          </AdminTypo.Secondarybutton>
        ) : row?.lms_test_trackings?.[0]?.certificate_status === false ? (
          <AdminTypo.H6 color="red.500">{t("FAILED")}</AdminTypo.H6>
        ) : (
          <AdminTypo.H6>{t("PENDING")}</AdminTypo.H6>
        ),
    },
  ];
  if (width <= 767) {
    return [
      ...data.filter((e) => [t("NAME"), t("ID")].includes(e.name)),
      ...days,
    ];
  }
  return data;
};

const RenderAttendanceColumn = memo(({ row, event, locationData }) => {
  const [attendance, setAttendance] = useState();
  const [isDisabledAttBtn, setIsDisabledAttBtn] = useState();
  const { id } = useParams();
  const [error, setError] = useState();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchAttendance = async () => {
      const newAttendance = row?.attendances?.find((e) => {
        const format = "YYYY-MM-DD";
        return (
          moment(e.date_time).format(format) ===
          moment(row.presentDate).format(format)
        );
      });
      setAttendance(newAttendance);
    };
    fetchAttendance();
  }, [row]);

  const onSwitchToggle = async (row) => {
    setIsDisabledAttBtn(`${row.id}-${row.presentDate}`);
    const result = await onUpdateOrCreateAttendace({
      ...row,
      event_id: id,
      locationData,
      attendance,
    });
    setAttendance(
      result?.data?.attendance
        ? { ...result?.data?.attendance, status: row?.attendance_status }
        : attendance,
    );
    setIsDisabledAttBtn();
  };

  return (
    <HStack space="2" p="1">
      <AdminTypo.H7 fontWeight="400">
        {attendance?.status === "present"
          ? "Present"
          : attendance?.status === "absent"
            ? "Absent"
            : "Mark"}
      </AdminTypo.H7>
      <Switch
        key={attendance?.status + error}
        isDisabled={isDisabledAttBtn === `${row.id}-${row.presentDate}`}
        offTrackColor={attendance?.status ? "dangerColor" : "gray.200"}
        onTrackColor="successColor"
        onThumbColor="appliedColor"
        offThumbColor="appliedColor"
        defaultIsChecked={attendance?.status === "present"}
        onValueChange={async (e) => {
          const { presentDate } = row;
          const format = "YYYY-MM-DD HH:mm";
          const currentDate = moment();
          const startDate = moment
            .utc(
              event?.start_date + " " + event?.start_time,
              "YYYY-MM-DD HH:mm:ss",
            )
            ?.local();
          const endDate = moment
            .utc(event?.end_date + " " + event?.end_time, "YYYY-MM-DD HH:mm:ss")
            ?.local();

          const newPresentDate = moment(
            `${presentDate} ${moment().format("HH:mm")}`,
            format,
          );
          if (startDate.isSameOrAfter(currentDate)) {
            setError(t("ATTENDANCE_FUTURE_DATE_ERROR_MESSAGE"));
          } else if (endDate.isSameOrBefore(currentDate)) {
            setError(t("ATTENDANCE_PAST_DATE_ERROR_MESSAGE"));
          } else if (newPresentDate.isSameOrBefore(currentDate)) {
            const attendance_status = e ? "present" : "absent";
            await onSwitchToggle({
              ...row,
              attendance_status,
            });
          } else {
            setError(t("ATTENDANCE_FUTURE_DATE_ERROR_MESSAGE"));
          }
        }}
      />
      <Modal isOpen={error} size="lg">
        <Modal.Content>
          <Modal.Body p="5">
            <IconByName
              position="absolute"
              top="0"
              right="0"
              zIndex="1"
              name="CloseCircleLineIcon"
              onPress={(e) => setError()}
            />
            <Alert status="warning" alignItems={"start"}>
              <HStack alignItems="center" space="2">
                <Alert.Icon />
                {error}
              </HStack>
            </Alert>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </HStack>
  );
});

export default function App(props) {
  const { t } = useTranslation();
  const [lat, long, locationMessage, locationLoding] = useLocationData();
  return !(lat && long) ? (
    <Layout
      _appBar={{
        isShowNotificationButton: true,
      }}
      _sidebar={props?.footerLinks}
      loading={locationLoding}
    >
      <VStack space={4} alignItems="center">
        <IconByName
          name="MapPinLineIcon"
          _icon={{ size: "100px" }}
          color="blue.500"
        />
        <AdminTypo.H3 fontSize="lg" textAlign="center">
          {t("ALLOW_LOCATION_ACCESS")}
        </AdminTypo.H3>
        <AdminTypo.H3 fontSize="lg" textAlign="center">
          ({t(locationMessage)})
        </AdminTypo.H3>
        <AdminTypo.H3 fontSize="sm" textAlign="center" color="gray.500">
          {t("LOCATION_SERVICES_DESCRIPTION")}
        </AdminTypo.H3>
        <AdminTypo.PrimaryButton
          onPress={(e) => window.location.reload()}
          mt="4"
          colorScheme="blue"
        >
          {t("ALLOW_LOCATION_BUTTON")}
        </AdminTypo.PrimaryButton>
      </VStack>
    </Layout>
  ) : (
    <Attendence {...props} locationData={{ lat, long }} />
  );
}

export function Attendence({ footerLinks, locationData }) {
  const { id } = useParams();
  const { width } = useWindowDimensions();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [paginationTotalRows, setPaginationTotalRows] = useState(0);
  const [event, setEvent] = useState("");
  const [loading, setLoading] = useState(true);
  const [actualDates, setActualDates] = useState([]);
  const [certificateHtml, setCertificateHtml] = useState();
  const reportTemplateRef = useRef(null);
  const [filter, setFilter] = useState({});
  const [eventDates, setEventDates] = useState([]);
  const [enums, setEnums] = useState();
  const [openStartExam, setOpenStartExam] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const toast = useToast();

  const certificateDownload = async (data) => {
    const result = await testRegistryService.postCertificates(data);
    setCertificateHtml(result?.data?.[0]?.certificate_html);
  };

  const handleGeneratePdf = async () => {
    const input = reportTemplateRef.current;
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l");
      pdf.addImage(imgData, "JPEG", 0, 0);
      pdf.save("download.pdf");
    });
  };

  const getUsers = async () => {
    const result = await eventService.getAttendanceList({
      limit: 6,
      page: 1,
      order_by: { id: "desc" },
      ...filter,
      id,
    });
    setPaginationTotalRows(result?.totalCount);
    setUsers(result?.data || []);
  };

  useEffect(() => {
    const fetchData = async () => {
      const enumApiData = await enumRegistryService.listOfEnum();
      setEnums(enumApiData?.data);
    };
    fetchData();
  }, []);

  useEffect(async () => {
    await getUsers();
  }, [filter]);

  useEffect(async () => {
    setLoading(true);
    const eventResult = await eventService.getEventListById({ id });
    setEvent(eventResult?.event);
    // please check params?.attendance_type === "one_time" condition
    if (eventResult?.event?.params?.attendance_type === "one_time") {
      setActualDates([
        {
          name: t("MARK_ATTENDANCE"),
          selector: (row) => (
            <Suspense fallback="...">
              <RenderAttendanceColumn {...{ row, event, locationData }} />
            </Suspense>
          ),
          sortable: false,
          attr: "marks",
        },
      ]);
    } else {
      const startMoment = moment(eventResult?.event?.start_date);
      const endMoment = moment(eventResult?.event?.end_date);
      let datesD = [];
      while (startMoment.isSameOrBefore(endMoment)) {
        datesD.push(startMoment.format("DD-MMM-YYYY"));
        startMoment.add(1, "day");
      }

      if (width <= 767) {
        setEventDates(datesD);
        setDate(datesD?.[0] ? [datesD?.[0]] : [], eventResult?.event);
      } else {
        setDate(datesD, eventResult?.event);
      }
    }
    setLoading(false);
  }, [width]);

  const setDate = (datesD, eventData) => {
    const dates = datesD?.map((e, i) => ({
      name: t(moment(e).format("DD-MMM-YYYY")),
      selector: (row) => (
        <Suspense fallback="...">
          <RenderAttendanceColumn
            row={{
              ...row,
              index: i,
              presentDate: `${moment(e).format("YYYY-MM-DD")}`,
            }}
            {...{ locationData }}
            event={eventData}
          />
        </Suspense>
      ),
      sortable: false,
      wrap: true,
      attr: "marks",
    }));
    setActualDates(dates);
  };

  const handleSearch = (e) => {
    setFilter({ ...filter, search: e.nativeEvent.text, page: 1 });
  };

  const startExam = async () => {
    setIsButtonLoading(true);
    const result = await eventService.startExam(id);
    if (result?.success === true) {
      setIsButtonLoading(false);
      setOpenStartExam(false);
    } else {
      setIsButtonLoading(false);
      toast.show({
        render: () => {
          return (
            <Alert status="error" alignItems={"start"} mb="3" mt="4">
              <HStack alignItems="center" space="2" color>
                <Alert.Icon />
                <AdminTypo.H6>{result?.message}</AdminTypo.H6>
              </HStack>
            </Alert>
          );
        },
      });
    }
  };

  const editEvent = () => {
    if (event?.params?.start_exam === "yes") {
      toast.show({
        render: () => {
          return (
            <Alert status="warning" alignItems={"start"} mb="3" mt="4">
              <HStack alignItems="center" space="2" color>
                <Alert.Icon />
                <AdminTypo.H6>{t("EDIT_EVENT_WARNING")}</AdminTypo.H6>
              </HStack>
            </Alert>
          );
        },
      });
    } else {
      navigate(`/admin/event/${id}/edit`);
    }
  };

  const debouncedHandleSearch = useCallback(debounce(handleSearch, 1000), []);

  return (
    <Layout
      _appBar={{
        isShowNotificationButton: true,
      }}
      _sidebar={footerLinks}
      loading={loading}
    >
      <VStack py={4} px={[1, 1, 4]}>
        <VStack space={[6, 6, 8]}>
          <Breadcrumb
            drawer={<IconByName size="sm" name="ArrowRightSLineIcon" />}
            data={[
              <HStack key="1" space={"2"}>
                <IconByName isDisabled name="Home4LineIcon" />
                <AdminTypo.H4
                  onPress={() => {
                    navigate("/admin");
                  }}
                >
                  {t("HOME")}
                </AdminTypo.H4>
              </HStack>,
              <AdminTypo.H4 bold key="2">
                {t("EVENT_SCHEDULED")}
              </AdminTypo.H4>,
              <GetEnumValue
                key="3"
                bold
                t={t}
                enumType="EVENT_BATCH_NAME"
                enumOptionValue={event?.name}
                enumApiData={enums}
              />,
              <Chip key={"4"}>{event?.id}</Chip>,
            ]}
          />
          <VStack bg="timeLineBg" rounded={"xl"} p={4}>
            <Stack
              space={[2, 2, 10]}
              direction={["column", "column", "row"]}
              alignItems={["", "", "center"]}
              flexWrap="wrap"
            >
              <HStack alignItems={"center"} space="1">
                <IconByName
                  name="CalendarLineIcon"
                  color="textGreyColor.800"
                  _icon={{ size: "18" }}
                />
                <HStack
                  alignItems={"center"}
                  space="2"
                  divider={<HStack py="1">:</HStack>}
                >
                  <AdminTypo.H6 bold>{t("EVENT_TYPE")}</AdminTypo.H6>
                  <GetEnumValue
                    bold
                    t={t}
                    enumType="FACILITATOR_EVENT_TYPE"
                    enumOptionValue={event?.type}
                    enumApiData={enums}
                  />
                </HStack>
              </HStack>
              <HStack
                space={1}
                direction={["column", "row", "row"]}
                alignItems={["", "", "center"]}
              >
                <HStack alignItems={"center"} space="1">
                  <IconByName
                    name="CalendarLineIcon"
                    color="textGreyColor.800"
                    _icon={{ size: "18" }}
                  />
                  <AdminTypo.H7 bold color="textGreyColor.800">
                    {event?.start_date && event?.start_time
                      ? moment
                          .utc(
                            event?.start_date + " " + event?.start_time,
                            "YYYY-MM-DD HH:mm:ss",
                          )
                          ?.local()
                          ?.format("MMM DD, YYYY hh:mm A")
                      : "-"}
                  </AdminTypo.H7>
                </HStack>
                <HStack alignItems={"center"} space="1">
                  <AdminTypo.H7 bold>to</AdminTypo.H7>
                  <AdminTypo.H7 bold color="textGreyColor.800">
                    {event?.end_date && event?.end_time
                      ? moment
                          .utc(
                            event?.end_date + " " + event?.end_time,
                            "YYYY-MM-DD HH:mm:ss",
                          )
                          ?.local()
                          ?.format("MMM DD, YYYY hh:mm A")
                      : "-"}
                  </AdminTypo.H7>
                </HStack>
              </HStack>
              <HStack space={1} alignItems={"center"}>
                <IconByName
                  name="UserLineIcon"
                  color="textGreyColor.800"
                  _icon={{ size: "18" }}
                />
                <AdminTypo.H7 bold>{t("MASTER_TRAINER")} -</AdminTypo.H7>
                <Badge alignSelf="center" bg="white" borderRadius="5px">
                  {event?.master_trainer ? event?.master_trainer : ""}
                </Badge>
              </HStack>
              <AdminTypo.Secondarybutton onPress={editEvent}>
                {t("EDIT")}
              </AdminTypo.Secondarybutton>
              <AdminTypo.PrimaryButton onPress={() => setOpenStartExam(true)}>
                {t("START_EXAM")}
              </AdminTypo.PrimaryButton>
            </Stack>
          </VStack>
          <Stack space={4}>
            <HStack
              justifyContent={"space-between"}
              direction={["column", "column", "row"]}
              alignItems={["", "", "center"]}
              space={4}
            >
              <HStack
                space={[2, 2, 4]}
                // direction={["column", "column", "row"]}
                // alignItems={["", "", "center"]}
                justifyContent={["space-between"]}
              >
                <HStack space={[1, 1, 3]}>
                  <IconByName isDisabled name="GroupLineIcon" />
                  <AdminTypo.H4 bold>
                    {t("CANDIDATES")} ({users?.length})
                  </AdminTypo.H4>
                </HStack>
                <AdminTypo.Secondarybutton
                  onPress={(e) => {
                    navigate(`/admin/event/${id}/candidate`);
                  }}
                >
                  {t(width <= 767 ? "ADD_REMOVE" : "ADD_PARTICIPANTS")}
                </AdminTypo.Secondarybutton>
              </HStack>
              <Input
                // value={filter?.search}
                maxLength={12}
                name="numberInput"
                placeholder={t("SEARCH")}
                variant="outline"
                onChange={debouncedHandleSearch}
                minH={[9]}
              />
              {width <= 767 && (
                <HStack alignItems={"center"} space="1">
                  <AdminTypo.H4 flex="5">{t("ATTENDANCE_FOR")}: </AdminTypo.H4>
                  <Select
                    minH={[9]}
                    maxH={[9]}
                    flex="7"
                    accessibilityLabel={t("ATTENDANCE_FOR")}
                    placeholder={t("ATTENDANCE_FOR")}
                    selectedValue={actualDates?.[0]?.name || ""}
                    onValueChange={(itemValue) =>
                      setDate(itemValue ? [itemValue] : [], event)
                    }
                  >
                    {eventDates?.map((e) => (
                      <Select.Item label={e} value={e} key={e} />
                    ))}
                  </Select>
                </HStack>
              )}
            </HStack>
            <DataTable
              columns={[
                ...scheduleCandidates({
                  t,
                  days: actualDates,
                  certificateDownload,
                  width,
                }),
              ]}
              key={users + width}
              data={users}
              persistTableHead
              progressPending={loading}
              customStyles={customStyles}
              pagination
              paginationServer
              paginationTotalRows={paginationTotalRows}
              paginationRowsPerPageOptions={[10, 15, 25, 50, 100]}
              paginationPerPage={filter?.limit ? filter?.limit : 6}
              paginationDefaultPage={filter?.page}
              onChangeRowsPerPage={useCallback(
                (e) => {
                  setFilter({ ...filter, limit: e, page: 1 });
                },
                [filter],
              )}
              onChangePage={useCallback(
                (e) => {
                  setFilter({ ...filter, page: e });
                },
                [filter],
              )}
            />
          </Stack>
        </VStack>

        <Modal isOpen={certificateHtml} size="full" margin={"auto"}>
          <Modal.Content>
            <Modal.Header>
              <HStack justifyContent={"space-between"} pr="10">
                <AdminTypo.H1>{t("CERTIFICATION")}</AdminTypo.H1>
                <AdminTypo.Secondarybutton onPress={() => handleGeneratePdf()}>
                  {t("DOWNLOAD")}
                </AdminTypo.Secondarybutton>
                <IconByName
                  name="CloseCircleLineIcon"
                  onPress={(e) => setCertificateHtml()}
                />
              </HStack>
            </Modal.Header>
            <div className="certificae-parent">
              <Modal.Body>
                <div ref={reportTemplateRef} className="certificae-height">
                  <div dangerouslySetInnerHTML={{ __html: certificateHtml }} />
                </div>
              </Modal.Body>
            </div>
          </Modal.Content>
        </Modal>

        <Modal isOpen={openStartExam} size="xl">
          <Modal.Content>
            <Modal.Header textAlign={"center"}>
              {t("START_EXAM_MODAL_CONTENT.HEADING")}
            </Modal.Header>
            <Modal.Body p="5">
              <AdminTypo.H5>
                {t("START_EXAM_MODAL_CONTENT.MESSAGE_1")}
              </AdminTypo.H5>
              <AdminTypo.H5>
                {t("START_EXAM_MODAL_CONTENT.MESSAGE_2")}
              </AdminTypo.H5>
              <AdminTypo.H5>
                {t("START_EXAM_MODAL_CONTENT.MESSAGE_3")}
              </AdminTypo.H5>
            </Modal.Body>
            <Modal.Footer justifyContent={"space-evenly"}>
              <AdminTypo.PrimaryButton onPress={() => setOpenStartExam(false)}>
                {t("CANCEL")}
              </AdminTypo.PrimaryButton>
              <AdminTypo.Secondarybutton
                isDisabled={isButtonLoading}
                onPress={startExam}
              >
                {t("CONFIRM")}
              </AdminTypo.Secondarybutton>
            </Modal.Footer>
          </Modal.Content>
        </Modal>
      </VStack>
    </Layout>
  );
}
RenderAttendanceColumn.propTypes = {
  row: PropTypes.any,
  event: PropTypes.any,
  locationData: PropTypes.any,
};
Attendence.propTypes = {
  footerLinks: PropTypes.any,
  locationData: PropTypes.object,
};

App.propTypes = {
  footerLinks: PropTypes.any,
};
