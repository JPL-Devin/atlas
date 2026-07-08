import React from "react";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";

const StyledGrid = styled(Grid)({
  width: "100%",
  maxHeight: 45
});

const TitleText = styled(Typography)({
  color: "#343a40",
  fontWeight: 900,
  fontSize: 42,
  letterSpacing: "0rem",
  paddingRight: 55
});

/**
 * Component that displays target body name in console.
 * Retrieves target name from target selector
 *
 * @component
 * @example
 * const target = Mars
 * return (
 *   <ConsoleTargetInfo target={target}/>
 * )
 */
export default function ConsoleTargetInfo(props) {
  return (
    <StyledGrid
      container
      item
      justifyContent="center"
      alignItems="center"
      xs
    >
      <Grid item>
        <TitleText id="targetName" variant="h4">
          {props.target.toUpperCase()}
        </TitleText>
      </Grid>
    </StyledGrid>
  );
}
