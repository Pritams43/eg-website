import { HStack, Heading, Image, VStack, Stack, Text } from "native-base";
import { ImageBackground, StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dataConfig } from "./card";
import Layout from "./Layout";
import { chunk } from "@shiksha/common-lib";
import slide2 from "./assets/images/slide-2.png";
import slide3 from "./assets/images/slide-3.png";
import slide4 from "./assets/images/slide-4.png";
import slide5 from "./assets/images/slide-5.png";
import PropTypes from "prop-types";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import { useTranslation } from "react-i18next";

const styles = StyleSheet.create({
  backgroundImage: {
    backgroundSize: "cover",
    backgroundPosition: "center",
    height: "74px",
    marginBottom: "20px",
  },
});

const CAROUSEL_LIST = [
  { bgImage: slide2, title: "What would you like to explore today?" },
  { bgImage: slide3, title: "Jobs & Internships" },
  { bgImage: slide4, title: "Scholarships" },
  { bgImage: slide5, title: "Skill Development & Learning" },
];

const responsive = {
  superLargeDesktop: {
    // the naming can be any, depends on you.
    breakpoint: { max: 4000, min: 3000 },
    items: 1,
  },
  desktop: {
    breakpoint: { max: 3000, min: 1024 },
    items: 1,
  },
  tablet: {
    breakpoint: { max: 1024, min: 464 },
    items: 1,
  },
  mobile: {
    breakpoint: { max: 464, min: 0 },
    items: 1,
  },
};

const LandingPage = ({ footerLinks }) => {
  const [dataArray, setDataArray] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const chuckArr = Object.values(dataConfig);
    const newArr = chunk(chuckArr, 2);
    setDataArray(newArr);
  }, []);

  const handleCardClick = async (title) => {
    try {
      navigate(`/${title}`);
    } catch (error) {
      console.error(`Error fetching data for ${title}:`, error);
    }
  };

  const handleBack = () => {
    navigate(`/`);
  };

  return (
    <Layout
      _footer={{ menues: footerLinks }}
      _appBar={{
        onPressBackButton: handleBack,
      }}
    >
      <VStack p="4" space={4}>
        <Carousel
          responsive={responsive}
          showDots={true}
          infinite={true}
          autoPlaySpeed={1000}
          keyBoardControl={true}
          customTransition="all .5"
          transitionDuration={500}
          containerClass="carousel-container"
          removeArrowOnDeviceType={["tablet", "mobile", "desktop"]}
          dotListClass="custom-dot-list-style"
          itemClass="carousel-item-padding-40-px"
        >
          {CAROUSEL_LIST.map((item, i) => {
            return (
              <ImageBackground
                key={`carousel-item-${item.title + i}`}
                source={{ uri: item.bgImage }}
                style={styles.backgroundImage}
              >
                <Stack space={4} p={4} alignItems="center">
                  <Text
                    color={"#484848"}
                    fontSize={"16px"}
                    fontWeight={500}
                    width={"70%"}
                  >
                    {item.title}
                  </Text>
                </Stack>
              </ImageBackground>
            );
          })}
        </Carousel>

        {dataConfig.constructor.name === "Object" &&
          dataArray?.map((pItem) => (
            <HStack space={"6%"} key={pItem}>
              {pItem.map((item) => {
                return (
                  <FeatureCard
                    key={item}
                    title={item?.title}
                    onClick={() => handleCardClick(item?.listLink)}
                    imageUrl={item?.imageUrl}
                    width={"47%"}
                    height={"180px"}
                  />
                );
              })}
            </HStack>
          ))}
      </VStack>
    </Layout>
  );
};

export const FeatureCard = ({ title, onClick, imageUrl, ...props }) => {
  const { t } = useTranslation();

  return (
    <VStack
      p="6"
      borderWidth="1px"
      borderColor="gray.300"
      borderRadius="10px"
      alignItems="center"
      textAlign="center"
      shadow="4"
      onClick={onClick}
      cursor="pointer"
      {...props}
    >
      {imageUrl && (
        <Image
          src={imageUrl}
          source={{ uri: imageUrl }}
          alt={title}
          mb="4"
          size={"lg"}
          height={"74px"}
          width={"74px"}
          color={"black"}
        />
      )}
      <Heading as="h2" size="md" mb="2" fontSize={"16px"} fontWeight={"500"}>
        {t(title) || "Untitled"}
      </Heading>
    </VStack>
  );
};

FeatureCard.propTypes = {
  title: PropTypes.string,
  onClick: PropTypes.func,
  imageUrl: PropTypes.any,
};

LandingPage.propTypes = {
  footerLinks: PropTypes.any,
};

export default LandingPage;
