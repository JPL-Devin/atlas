import React from 'react';
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Zoom from "@mui/material/Zoom";
import { alpha, styled } from "@mui/material/styles";
import Link from "@mui/material/Link";
import StyledTooltip from "./StyledTooltip.jsx";

const WktRoot = styled("div")({
  textAlign: "center",
  maxHeight: 80,
  height: 80,
  backgroundColor: "#f8f9fa",
  overflow: "hidden"
});

const WktContainer = styled("div")({
  padding: "1rem",
  height: 50,
  width: "75%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  margin: "auto"
});

const WktTextbox = styled(TextField)({
  flex: "3 1 auto",
  backgroundColor: "#e9ecef",
  "&:focus": {
    borderColor: "#1971c2"
  }
});

const WktButton = styled(Button)({
  height: 40,
  color: "#fff",
  backgroundColor: "#1971c2",
  width: "9rem",
  marginLeft: "1rem",
  alignSelf: "center",
  "&:hover": {
    backgroundColor: alpha("#1971c2", 0.7)
  }
});

/**
 * Component that accepts user input of Well-Known Text
 *
 * @component
 * @example
 * <WellKnownTextInput />
 *
 */
export default function WellKnownTextInput() {
  const wktLink =
    "https://www.vertica.com/docs/9.2.x/HTML/Content/Authoring/AnalyzingData/Geospatial/Spatial_Definitions/WellknownTextWKT.htm";

  return (
    <WktRoot>
      <StyledTooltip
        title={
          <Typography>
            Enter a <Link href={wktLink}>Well-Known Text</Link> string then
            press "Draw on Map" to plot the polygon on the map.
          </Typography>
        }
        enterDelay={800}
        leaveDelay={250}
        arrow
        TransitionComponent={Zoom}
      >
        <WktContainer>
          <WktTextbox
            variant="outlined"
            label="Enter WKT String"
            InputLabelProps={{
              shrink: true
            }}
            id="wktTextBox"
            name="fname"
            type="text"
            autoComplete="off"
          />
          <WktButton variant="contained" id="wktButton">
            Draw On Map
          </WktButton>
        </WktContainer>
      </StyledTooltip>
    </WktRoot>
  );
}
