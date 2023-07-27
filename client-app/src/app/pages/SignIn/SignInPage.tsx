import { Fragment } from "react";
import Footer from "../../components/Footer/Footer";
import Navbar from "../../components/Homepage/Navbar";
import SignIn from "../../components/Login/Login";
import { PaletteMode, ThemeProvider, createTheme } from "@mui/material";
import Avatar from "@mui/material/Avatar";
import CssBaseline from "@mui/material/CssBaseline";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Container from "@mui/material/Container";
import { Link } from "react-router-dom";

const theme = createTheme();

const SignInPage = () => {
    return (
        <>
            <Navbar />
            <Fragment>
                <ThemeProvider theme={theme}>
                    <Container
                        component="main"
                        maxWidth="xs"
                        style={{ height: "100vh" }}
                    >
                        <CssBaseline />
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                flexDirection: "column",
                                height: "100vh",
                            }}
                        >
                            <Box component="div" sx={{ mt: 1 }}>
                                <SignIn />
                            </Box>
                        </Box>
                    </Container>
                </ThemeProvider>
            </Fragment>
            <Footer />
        </>
    );
};

export default SignInPage;
