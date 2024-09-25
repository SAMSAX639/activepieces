import { ActivepiecesError, apId, assertNotNullOrUndefined, EnginePrincipal, ErrorCode, isNil, Principal, PrincipalType, ProjectId, WorkerMachineType, WorkerPrincipal } from '@activepieces/shared'
import dayjs from 'dayjs'
import { jwtUtils } from '../../helper/jwt-utils'
import { userService } from '../../user/user-service'

export const accessTokenManager = {
    async generateToken(principal: Principal, expiresInSeconds: number = 7 * 30 * 24 * 60 * 60): Promise<string> {
        const secret = await jwtUtils.getJwtSecret()
        if(principal.type === PrincipalType.USER){
            const user = await userService.getOneOrFail({id: principal.id})
            return jwtUtils.sign({
                payload: {
                    ...principal,
                    tokenVersion: user.tokenVersion
                },
                key: secret,
                expiresInSeconds,
            })
        }
        return jwtUtils.sign({
            payload: principal,
            key: secret,
            expiresInSeconds,
        })
    },

    async generateEngineToken({ jobId, projectId, queueToken }: GenerateEngineTokenParams): Promise<string> {
        const enginePrincipal: EnginePrincipal = {
            id: jobId ?? apId(),
            type: PrincipalType.ENGINE,
            projectId,
            queueToken,
        }

        const secret = await jwtUtils.getJwtSecret()

        return jwtUtils.sign({
            payload: enginePrincipal,
            key: secret,
            expiresInSeconds: dayjs.duration(2, 'days').asSeconds(),
        })
    },

    async generateWorkerToken({ type, platformId }: { platformId: string | null, type: WorkerMachineType }): Promise<string> {
        const workerPrincipal: WorkerPrincipal = {
            id: apId(),
            type: PrincipalType.WORKER,
            platform: isNil(platformId) ? null : {
                id: platformId,
            },
            worker: {
                type,
            },
        }

        const secret = await jwtUtils.getJwtSecret()

        return jwtUtils.sign({
            payload: workerPrincipal,
            key: secret,
            expiresInSeconds: dayjs.duration(100, 'year').asSeconds(),
        })
    },


    async extractPrincipal(token: string): Promise<Principal> {
        const secret = await jwtUtils.getJwtSecret()

        try {
            const decoded = await jwtUtils.decodeAndVerify<Principal>({
                jwt: token,
                key: secret,
            })
            assertNotNullOrUndefined(decoded.type, 'decoded.type')
            if(decoded.type === PrincipalType.USER) {
                const user = await userService.getOneOrFail({id: decoded.id})
                const isVerified = (
                    !isNil(user) && (
                    (user.tokenVersion === null && decoded.tokenVersion === undefined) || 
                    (user.tokenVersion === decoded.tokenVersion)))
                if(!isVerified) {
                    throw new ActivepiecesError({
                        code: ErrorCode.INVALID_BEARER_TOKEN,
                        params: {
                            message: 'invalid access token',
                        },
                    })
                }
            }
            return decoded
        }
        catch (e) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_BEARER_TOKEN,
                params: {
                    message: 'invalid access token',
                },
            })
        }
    },
}

type GenerateEngineTokenParams = {
    projectId: ProjectId
    queueToken?: string
    jobId?: string
}
