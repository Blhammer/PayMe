import { toast } from "react-toastify";
import axios, { AxiosError, AxiosResponse } from "axios";
import {
    CheckPaymentData,
    CheckPaymentFormValues,
} from "../models/checkPaymentStore";
import { history } from "../..";
import { store } from "../stores/store";
import { User, UserFormValues } from "../models/user";
import { Photo, Profile } from "../models/profile";
import { PaginatedResult } from "../models/pagination";

axios.defaults.baseURL = process.env.REACT_APP_API_URL;

axios.defaults.headers.post["Content-Type"] = "application/json";

axios.interceptors.request.use((config) => {
    const token = store.commonStore.token;

    if (token) {
        config.headers!["Authorization"] = `Bearer ${token}`;
    }

    return config;
});

axios.interceptors.response.use(
    async (response) => {
        const pagination = response.headers["pagination"];

        if (pagination) {
            response.data = new PaginatedResult(
                response.data,
                JSON.parse(pagination)
            );

            return response as AxiosResponse<PaginatedResult<any>>;
        }

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
                    history.push("/");
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
                    headers["WWW-Authenticate"]?.startsWith(
                        'Bearer error="invalid_token"'
                    )
                ) {
                    store.userStore.logout();
                    toast.error("Session expired - please login again");
                }
                break;

            case 404:
                history.push("/");
                break;

            case 500:
                store.commonStore.setServerError(data);
                history.push("/");
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
    list: (params: URLSearchParams) =>
        axios
            .get<PaginatedResult<CheckPaymentData[]>>("/payments", { params })
            .then(
                (
                    response: AxiosResponse<PaginatedResult<CheckPaymentData[]>>
                ) => {
                    const paginationHeaders = response.headers["pagination"];
                    const pagination = paginationHeaders
                        ? JSON.parse(paginationHeaders)
                        : null;

                    const paginatedResult = new PaginatedResult<
                        CheckPaymentData[]
                    >(response.data.data, pagination);

                    return paginatedResult;
                }
            ),
    total: () => requests.get("/payments/total"),
    details: (id: string) => requests.get<CheckPaymentData>(`/payments/${id}`),
    create: (checkPayment: CheckPaymentFormValues) =>
        requests.post<void>("/payments", checkPayment),
    update: (checkPayment: CheckPaymentFormValues) =>
        requests.put<void>(`/payments/${checkPayment.id}`, checkPayment),
    delete: (id: string) => requests.del<void>(`/payments/${id}`),
};

const Account = {
    current: () => requests.get<User>("/account"),
    login: (user: UserFormValues) =>
        requests.post<User>("/account/login", user),
    register: (user: UserFormValues) =>
        requests.post<User>("/account/register", user),
    doesEmailExist: (email: string) =>
        requests.get(`/account/doesEmailExist?email=${email}`),
    resetPassword: (email: string, password: string) =>
        requests.put<void>("/account/resetPassword", { email, password }),
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
