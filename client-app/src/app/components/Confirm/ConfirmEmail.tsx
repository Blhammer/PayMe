import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button, Header, Icon, Segment } from "semantic-ui-react";
import useQuery from "../../utils/hooks";
import { useStore } from "../../stores/store";
import api from "../../api/api";
import SignInPage from "../../pages/SignIn/SignInPage";
import Login from "../Login/Login";

const ConfirmEmail = () => {
    const { modalStore } = useStore();

    const email = useQuery().get("email") as string;
    const token = useQuery().get("token") as string;

    const Status = {
        Verifying: "Verifying",
        Failed: "Failed",
        Success: "Success",
    };

    const [status, setStatus] = useState(Status.Verifying);

    function handleConfirmEmailResend() {
        api.Account.resendEmailConfirm(email)
            .then(() => {
                toast.success(
                    "Verification email resent - please check your email"
                );
            })
            .catch((error) => console.log(error));
    }

    useEffect(() => {
        api.Account.verifyEmail(token, email)
            .then(() => {
                setStatus(Status.Success);
            })
            .catch(() => {
                setStatus(Status.Failed);
            });
    }, [Status.Failed, Status.Success, token, email]);

    function getBody() {
        switch (status) {
            case Status.Verifying:
                return <p>Verifying...</p>;

            case Status.Failed:
                return (
                    <div>
                        <p>
                            Verification failed. You can try resending the
                            verify link to your email
                        </p>
                        <Button
                            primary
                            onClick={handleConfirmEmailResend}
                            size="big"
                            content="Resend email"
                        />
                    </div>
                );

            case Status.Success:
                return (
                    <div>
                        <p>Email has been verified - you can now login</p>
                        <Button
                            primary
                            onClick={() => modalStore.openModal(<Login />)}
                            size="medium"
                            content="Login"
                        />
                    </div>
                );
        }
    }

    return (
        <Segment placeholder textAlign="center">
            <Header icon>
                <Icon name="envelope" />
                Email verification
            </Header>
            <Segment.Inline>{getBody()}</Segment.Inline>
        </Segment>
    );
};

export default ConfirmEmail;
