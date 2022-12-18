import axios, { AxiosError, AxiosResponse } from "axios";
import { toast } from "react-toastify";
import { history } from "../..";
import {
    CheckPayment,
    CheckPaymentFormValues,
} from "../models/checkPaymentStore";
import { store } from "../stores/store";
import { User, UserFormValues } from "../models/user";
import { Photo, Profile } from "../models/profile";

const sleep = (delay: number) => {
    return new Promise((resolve) => {
        setTimeout(resolve, delay);
    });
};

axios.defaults.baseURL = process.env.API_URL;

axios.interceptors.request.use((config) => {
    const token = store.commonStore.token;
    if (token) {
        config.headers!.Authorization = `Bearer ${token}`;
    }
    return config;
});

axios.interceptors.response.use(
    async (response) => {
        if (process.env.NODE_ENV === "development") await sleep(1000);

        return response;
    },
    (error: AxiosError) => {
        const {
            data,
            status,
            config,
            headers,
        }: { data: any; status: number; config: any; headers: any } =
            error.response!;

        switch (status) {
            case 400:
                if (
                    config.method === "get" &&
                    data.errors.hasOwnProperty("id")
                ) {
                    history.push("/not-found");
                }

                if (data.errors) {
                    const modalStateErrors = [];
                    for (const key in data.errors) {
                        if (data.errors[key]) {
                            modalStateErrors.push(data.errors[key]);
                        }
                    }
                    throw modalStateErrors.flat();
                } else {
                    toast.error(data);
                }
                break;

            case 401:
                if (
                    status === 401 &&
                    headers["www-authenticate"]?.startsWith(
                        'Bearer error="invalid_token"'
                    )
                ) {
                    store.userStore.logout();
                    toast.error("Session expired - please login again");
                }
                break;

            case 404:
                history.push("/not-found");
                break;

            case 500:
                store.commonStore.setServerError(data);
                history.push("/server-error");
                break;

            default:
                break;
        }

        return Promise.reject(error);
    }
);

const responseBody = <T>(response: AxiosResponse<T>) => response.data;

const requests = {
    get: <T>(url: string) => axios.get<T>(url).then(responseBody),
    post: <T>(url: string, body: {}) =>
        axios.post<T>(url, body).then(responseBody),
    put: <T>(url: string, body: {}) =>
        axios.put<T>(url, body).then(responseBody),
    del: <T>(url: string) => axios.delete<T>(url).then(responseBody),
};

const CheckPayments = {
    list: () => axios.get<CheckPayment[]>("/CheckPayments").then(responseBody),
    create: (checkPayment: CheckPaymentFormValues) =>
        requests.post<void>("/CheckPayments", checkPayment),
    update: (checkPayment: CheckPaymentFormValues) =>
        requests.put<void>(`/CheckPayments/${checkPayment.id}`, checkPayment),
    details: (id: string) => requests.get<CheckPayment>(`/CheckPayments/${id}`),
    delete: (id: string) => requests.del<void>(`/CheckPayments/${id}`),
};

const Account = {
    current: () => requests.get<User>("/account"),
    login: (user: UserFormValues) =>
        requests.post<User>("/account/login", user),
    register: (user: UserFormValues) =>
        requests.post<User>("/account/register", user),
    refreshToken: () => requests.post<User>("/account/refreshToken", {}),
    verifyEmail: (token: string, email: string) =>
        requests.post<void>(
            `/account/verifyEmail?token=${token}&email=${email}`,
            {}
        ),
    resendEmailConfirm: (email: string) =>
        requests.get(`/account/resendEmailConfirmationLink?email=${email}`),
};

const Profiles = {
    get: (username: string) => requests.get<Profile>(`/profiles/${username}`),
    uploadPhoto: (file: Blob) => {
        let formData = new FormData();
        formData.append("File", file);
        return axios.post<Photo>("photos", formData, {
            headers: { "Content-type": "multipart/form-data" },
        });
    },
    setMainPhoto: (id: string) => requests.post(`/photos/${id}/setMain`, {}),
    deletePhoto: (id: string) => requests.del(`/photos/${id}`),
    updateProfile: (profile: Partial<Profile>) =>
        requests.put(`/profiles`, profile),
};

const api = {
    CheckPayments,
    Account,
    Profiles,
};

export default api;
