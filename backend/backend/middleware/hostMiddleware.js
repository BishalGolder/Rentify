/*
=====================================================
HOST MIDDLEWARE
=====================================================

authMiddleware runs first.

authMiddleware:
    ↓
req.user
    ↓
Get profile from Supabase
    ↓
Check profiles.role
    ↓
Allow only host
=====================================================
*/

const hostMiddleware = async (
    req,
    res,
    next
) => {

    try {

        /*
        ==============================================
        CHECK AUTHENTICATION
        ==============================================
        */

        if (!req.user) {

            return res.status(401).json({

                message:
                    "Authentication required."

            });

        }


        /*
        ==============================================
        GET USER ID
        ==============================================
        */

        const userId =
            req.user.id;


        if (!userId) {

            return res.status(401).json({

                message:
                    "Invalid authenticated user."

            });

        }


        /*
        ==============================================
        GET PROFILE
        ==============================================
        */

        const {

            data: profile,

            error: profileError

        } = await req.supabase

            .from("profiles")

            .select("role")

            .eq(
                "id",
                userId
            )

            .single();


        /*
        ==============================================
        PROFILE ERROR
        ==============================================
        */

        if (profileError) {

            console.error(
                "Host middleware profile error:",
                profileError
            );

            return res.status(404).json({

                message:
                    "Account profile not found."

            });

        }


        /*
        ==============================================
        CHECK HOST ROLE
        ==============================================
        */

        if (
            !profile ||
            profile.role !== "host"
        ) {

            return res.status(403).json({

                message:
                    "Access denied. Host account required."

            });

        }


        /*
        ==============================================
        SAVE PROFILE IN REQUEST
        ==============================================
        
        This can be useful for controllers.
        */

        req.profile =
            profile;


        /*
        ==============================================
        EVERYTHING IS OK
        ==============================================
        */

        next();


    } catch (error) {

        console.error(
            "Host middleware error:",
            error
        );


        return res.status(500).json({

            message:
                "Host authorization failed.",

            error:
                error.message

        });

    }

};


export default hostMiddleware;