import AccessTimeIcon from '@mui/icons-material/AccessTime'
import ArchitectureIcon from '@mui/icons-material/Architecture'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFileOutlined'
import InventoryIcon from '@mui/icons-material/Inventory2Outlined'
import LayersIcon from '@mui/icons-material/LayersOutlined'
import PhotoCameraIcon from '@mui/icons-material/PhotoCameraOutlined'
import PlaceIcon from '@mui/icons-material/PlaceOutlined'
import PublicIcon from '@mui/icons-material/PublicOutlined'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunchOutlined'
import TrackChangesIcon from '@mui/icons-material/TrackChanges'
import WbSunnyIcon from '@mui/icons-material/WbSunnyOutlined'

/** Field-catalog icon names (`src/config/recordDetail/icons.json`) → components. */
const tileIcons = {
    angle: ArchitectureIcon,
    archive: InventoryIcon,
    calendar: CalendarTodayIcon,
    camera: PhotoCameraIcon,
    clock: AccessTimeIcon,
    file: InsertDriveFileIcon,
    filter: FilterAltIcon,
    layers: LayersIcon,
    orbit: TrackChangesIcon,
    place: PlaceIcon,
    spacecraft: RocketLaunchIcon,
    sun: WbSunnyIcon,
    target: PublicIcon,
}

export default tileIcons
