import * as React from "react";
import { useStore } from "../../stores/store";
import { observer } from "mobx-react-lite";
import { ErrorMessage, Form, Formik } from "formik";
import ValidationErrors from "../common/ValidationErrors";
import { Button, Header } from "semantic-ui-react";
import * as Yup from "yup";
import MyTextInput from "../Forms/MyTextInput";

const SignUp = () => {
    const { userStore } = useStore();

    return (
        <Formik
            initialValues={{
                username: "",
                firstName: "",
                lastName: "",
                email: "",
                password: "",
                rePassword: "",
                error: null,
            }}
            onSubmit={(values, { setErrors }) =>
                userStore
                    .register(values)
                    .catch((error) => setErrors({ error }))
            }
            validationSchema={Yup.object({
                username: Yup.string().required("Username is required!"),
                firstName: Yup.string().required("First name is required!"),
                lastName: Yup.string().required("Last name is required!"),
                email: Yup.string().required("Email is required!").email(),
                password: Yup.string()
                    .required("Please enter your password.")
                    .min(8, "Your password is too short."),
                rePassword: Yup.string()
                    .required("Please confirm your password.")
                    .oneOf([Yup.ref("password")], "Passwords do not match."),
            })}
        >
            {({ handleSubmit, isSubmitting, errors, isValid, dirty }) => (
                <Form
                    className="ui form error"
                    onSubmit={handleSubmit}
                    autoComplete="off"
                >
                    <Header
                        as="h2"
                        content="Sign up to Pay Me"
                        color="teal"
                        textAlign="center"
                    />
                    <MyTextInput
                        label="Username"
                        name="username"
                        placeholder="Username"
                    />
                    <MyTextInput
                        label="First Name"
                        name="firstName"
                        placeholder="First Name"
                    />
                    <MyTextInput
                        label="Last Name"
                        name="lastName"
                        placeholder="Last Name"
                    />
                    <MyTextInput
                        label="Email"
                        name="email"
                        placeholder="Email"
                    />
                    <MyTextInput
                        label="Password"
                        name="password"
                        placeholder="Password"
                        type="password"
                    />
                    <MyTextInput
                        label="Confirm Password"
                        name="rePassword"
                        placeholder="Confirm Password"
                        type="password"
                    />
                    <ErrorMessage
                        name="error"
                        render={() => (
                            <ValidationErrors errors={errors.error} />
                        )}
                    />
                    <Button
                        disabled={!isValid || !dirty || isSubmitting}
                        loading={isSubmitting}
                        positive
                        content="Register"
                        type="submit"
                        sx={{ mt: 3, mb: 2 }}
                        fluid
                    />
                </Form>
            )}
        </Formik>
    );
};

export default observer(SignUp);
