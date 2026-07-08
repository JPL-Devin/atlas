import React from "react";
import Tooltip from "@mui/material/Tooltip";
import { styled } from "@mui/material/styles";

const StyledTooltipComponent = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  '& .MuiTooltip-tooltip': {
    backgroundColor: "#f8f9fa",
    color: "rgba(0, 0, 0, 0.87)",
    maxWidth: 250,
    fontSize: 12,
    border: `2px solid ${theme.palette.divider}`,
    textAlign: "center",
  },
  '& .MuiTooltip-arrow': {
    color: "#f8f9fa",
  },
  '& .MuiTooltip-tooltipPlacementRight': {
    margin: "0 8px",
  },
  '& .MuiTooltip-tooltipPlacementLeft': {
    margin: "0 8px",
  },
  '& .MuiTooltip-tooltipPlacementTop': {
    margin: "8px 0",
  },
  '& .MuiTooltip-tooltipPlacementBottom': {
    margin: "8px 0",
  },
}))

export default function StyledTooltip(props) {
  return <StyledTooltipComponent {...props} />;
}
